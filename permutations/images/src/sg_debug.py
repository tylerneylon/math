# -*- coding: utf-8 -*-
""" sg_debug.py

    This module contains code purely to help build and debug shotglass-based
    servers.
"""


# _______________________________________________________________________
# Constants and globals

# Engineers of the future (that's you!), toggle this value to show or
# hide debug-oriented print statements.
do_debug_print = False


# _______________________________________________________________________
# Functions

def debug_print(*args, **kwargs):
    if do_debug_print:
        print(*args, **kwargs)
