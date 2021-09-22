#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" perm_imgs.py

    This is a simple static server to help develop images for an article I'm
    writing on permutations.

    Run this as:

        ./perm_imgs.py          # to serve on port 80; or
        ./perm_imgs.py --debug  # to serve on port 8080, with verbose output.
"""


# _______________________________________________________________________
# Imports

from glob import glob

import shotglass


# _______________________________________________________________________
# Handlers

def get_index_html():

    body_list = ['<html><body><ul>']
    for fname in sorted(glob('*.html')):
        body_list.append(f'\n<li><a href="{fname}">{fname}</a></li>')
    body_list.append('\n</ul></body></html>')

    return ''.join(body_list).encode()


# _______________________________________________________________________
# Main

if __name__ == '__main__':

    # The format here is:
    # [<path>, <handler_fn>, <list_of_keywords>]; the last value is optional
    # and indicates which keyword arguments the handler function accepts.

    GET_routes = [
            ['/', get_index_html]
    ]

    POST_routes = [
    ]

    shotglass.register_routes(GET_routes, POST_routes)

    shotglass.add_static_paths(glob('*.css'))
    shotglass.add_static_paths(glob('*.html'))
    shotglass.add_static_paths(glob('*.js'))
    shotglass.add_static_paths(glob('*.json'))
    shotglass.run_server()
