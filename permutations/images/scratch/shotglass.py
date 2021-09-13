#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" shotglass.py

    A micro-library to provide basic support for a Python-based server.

    See the file sg_example.py for a usage example.

    The general usage of shotglass is to register routes by calling
    shotglass.register_routes(), and then to run the server by calling
    shotglass.run_server().

    A single route is given as a list like this:

        [<string for the route>, <python handler fn>, <optional keywords>]

    eg, <string for the route> = /my/$var_a$/path/
    When variables are in a route, they become the first parameters handed to
    the handler function.

    The <optional keywords> element is a list of strings. Shotglass passes
    through url query values whose key is an element of this list. Those values
    are given to the handler function as Python keywords in the function's
    arguments.
"""


# _______________________________________________________________________
# Imports

import base64
import http.server
import json
import os
import socketserver
import sys
import threading
from urllib.parse import parse_qsl, unquote, urlparse

import sg_debug
from sg_debug import debug_print


# _______________________________________________________________________
# Constants and globals

PRODUCTION_PORT = 80
DEBUG_PORT = 8080
port = PRODUCTION_PORT  # This is changed to DEBUG_PORT in debug mode.

# Shotglass uses semantic versioning 2.0.0: https://semver.org/
VERSION = '0.1.0'

# This is a sentinal return object to identify when routing has failed.
BAD_PATH = {}

# This is a sentinal object to indicate a handler wants all query keywords.
FULL_QUERY = {}

# Variables used by our request handler.
all_routes = {}
do_use_auth = False
usr, pwd = None, None

is_debug_mode = False

server = None


# _______________________________________________________________________
# Internal functions

def _check_path_match(path, template):
    """ Return `does_match`, `args`. The first is a boolean indicating a match,
        while `args` is a list of matched template strings when they match.
    """

    args = []
    path_terms = path.split('/')
    template_terms = template.split('/')

    if len(path_terms) != len(template_terms):
        return False, args

    for p_term, t_term in zip(path_terms, template_terms):
        if len(t_term) > 0 and t_term[0] == '$' and t_term[-1] == '$':
            args.append(unquote(p_term.replace('_', ' ')))
        elif p_term.lower() != t_term.lower():
            return False, args

    return True, args

def _route_path(method, path, data=None, **kwargs):

    global all_routes

    routes = all_routes[method]

    # At this point it's important that the templates are sorted longest to
    # shortest. That should be handled by the sorting done in register_routes().
    for route in routes:
        does_match, args = _check_path_match(path, route[0])
        if not does_match:
            continue
        fn = route[1]
        accepted_keywords = route[2] if len(route) >= 3 else []
        # Security: This filter is particularly critical for static file
        # serving. If this filter were not here, a malicious request could
        # provide the "path" keyword and cause us to load a file meant to be
        # kept private. (This can't happen with the current code.)
        kwargs = {
                k:v
                for k, v in kwargs.items()
                if accepted_keywords == FULL_QUERY or k in accepted_keywords
        }
        if method == 'POST':
            return fn(*args, data, **kwargs)
        if method == 'GET':
            return fn(*args, **kwargs)

    return BAD_PATH

def _guess_content_type(path):
    # This page was helpful in forming this list:
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    known_types = {
            'js'  : 'text/javascript',
            'mjs' : 'text/javascript',
            'css' : 'text/css',
            'txt' : 'text/plain',
            'jpg' : 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif' : 'image/gif',
            'htm' : 'text/html',
            'html': 'text/html',
            'ico' : 'image/vnd.microsoft.icon',
            'json': 'application/json',
            'png' : 'image/png',
            'pdf' : 'application/pdf',
            'svg' : 'image/svg+xml'
    }
    ext = path.split('.')[-1]
    return known_types.get(ext, 'text/plain')

def parse_data(data):
    return json.loads(data)

def enter_debug_mode(checkpoint_interval=None):

    global is_debug_mode, port

    print('Entering debug mode.')

    is_debug_mode = True
    # Use a different port to avoid debug mode in production.
    port = DEBUG_PORT
    sg_debug.do_debug_print = True


# _______________________________________________________________________
# Classes

class ShotGlassHandler(http.server.BaseHTTPRequestHandler):

    # ______________________________________________________________________
    # Utility methods.

    def _did_pass_security_check(self):
        """ This should be called before any other headers or response is
            initiated. This adds support for basic security. Note that this
            security method is weak without the additional presence of a secure
            transport layer (eg using HTTPS, not HTTP) because the password is
            sent unencrypted (unless HTTPS encrypts it for you).

            This returns True iff the request should continue.
        """

        # If security is turned off, skip the rest of this function.
        if not do_use_auth:
            return True  # True = accept request.

        # Check to see if they've already sent in a good usr/pwd.
        auth_str = self.headers.get('Authorization', None)
        usr_, pwd_ = None, None
        if auth_str and auth_str.startswith('Basic '):
            usrpwd = base64.b64decode(auth_str[6:]).decode('utf-8')
            usr_, pwd_ = usrpwd.split(':', 1)
        if (usr_ and pwd_) and (usr_ == usr) and (pwd_ == pwd):
            return True

        # At this point, security is on, and they have not yet been verified.
        self.send_response(401)
        self.send_header(
                'WWW-Authenticate',
                'Basic'
        )
        self.end_headers()
        return False

    def _init_response(self, content_type):
        """ This is meant as a high-level general setup for both HEAD and GET
            requests. """
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.end_headers()

    # ______________________________________________________________________
    # HTTP method handlers.

    def do_HEAD(self):
        if self._did_pass_security_check():
            self._init_response()

    def _do_COMMON(self, method, data=None):

        if not self._did_pass_security_check():
            return

        parsed = urlparse(self.path)
        kwargs = dict(parse_qsl(parsed.query))
        path = parsed.path
        response = None
        try:
            response = _route_path(method, path, data, **kwargs)
        except:
            threading.Thread(target=server.shutdown, daemon=True).start()
            raise

        if response is BAD_PATH:
            self.send_error(404, message='Unsupported path: %s' % path)
            return

        if type(response) is bytes:
            content_type = 'text/html'
        elif type(response) is str:
            content_type = 'text/html'
            response = response.encode('utf-8')
        elif type(response) is tuple:
            content_type = response[0]
            response = response[1]
        else:
            content_type = 'application/json'
            response = json.dumps(response).encode('utf-8') + b'\n'

        self._init_response(content_type)
        self.wfile.write(response)

    def do_GET(self):
        debug_print('GET Request:', self.path)
        debug_print(self.headers)
        self._do_COMMON('GET')

    def do_POST(self):

        debug_print('POST Request:', self.path)

        data = None

        # There may legitimately be no data. But if there is some, read it.
        data_len_list = self.headers.get_all('content-length')
        if data_len_list and len(data_len_list) > 0:
            data_len = int(data_len_list[-1])
            data = self.rfile.read(data_len).decode('utf-8')

        self._do_COMMON('POST', data)


# _______________________________________________________________________
# Public functions

def set_basic_auth(do_use_auth_, usr_=None, pwd_=None):
    """ Turn on or off basic authentication. This is off by default. When it's
        on, the client will receive a 401 status unless they have already
        successfully entered a username and password. This is not a beautiful
        interface, and is generally not what you want for a nice site. It might
        be what you want for a useful-but-not-necessarily-beautiful site. Also
        note that this is only strong when it is combined with HTTPS (not HTTP).
    """

    global do_use_auth, usr, pwd

    # If auth is turned on, then we must also be provided a usr_ and pwd_.
    assert (not do_use_auth_) or (usr_ and pwd_)

    do_use_auth, usr, pwd = do_use_auth_, usr_, pwd_

def register_routes(GET_routes, POST_routes):

    global all_routes

    all_routes = {
        'GET':  sorted(GET_routes,  key=lambda x: len(x[0]), reverse=True),
        'POST': sorted(POST_routes, key=lambda x: len(x[0]), reverse=True)
    }

def add_static_paths(paths):
    """ This expects `paths` to be an iterable that returns path strings. These
        paths will be served as static files on routes that are the same as the
        path strings. In particular, a glob is an acceptable input.

        Currently, each path is expected to specify a file, although in the
        future I'd like to support providing a directory instead (in which case
        all the files recursively under that directory would be served as static
        files).
    """
    new_routes = all_routes.get('GET', [])
    for path in paths:
        def handle_path(url_path=None, path=path):
            content_type = _guess_content_type(path)
            with open(path, 'rb') as f:
                return (content_type, f.read())
        route = path if path.startswith('/') else f'/{path}'
        new_routes.append([route, handle_path, 'url_path'])
        # Do extra work for `index.html` as a special case.
        if path == 'index.html':
            new_routes.append(['/', handle_path, 'url_path'])
    all_routes['GET'] = sorted(
            new_routes,
            key=lambda x: len(x[0]),
            reverse=True
    )

def run_server(exit_on_error=False, checkpoint_interval=None):

    global server

    if len(sys.argv) > 1 and sys.argv[1] == '--debug':
        enter_debug_mode()

    mode_name = 'debug' if is_debug_mode else 'production'
    print(f'*** {mode_name} mode ***')

    # Initiate the local HTTP server.
    server = socketserver.TCPServer(
            ('', port),
            ShotGlassHandler,
            False  # Delay binding to allow addr re-use.
    )
    server.allow_reuse_address = True

    try:
        server.server_bind()
        server.server_activate()
        print('shotglass serving at port %d.' % port)
        debug_print(f'My pid is {os.getpid()}.')
        server.serve_forever()

    except KeyboardInterrupt:
        server.shutdown()
        print('\nThank you for using shotglass!')
        sys.exit(0)
