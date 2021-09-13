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
# Main

if __name__ == '__main__':
    shotglass.add_static_paths(glob('*.css'))
    shotglass.add_static_paths(glob('*.html'))
    shotglass.add_static_paths(glob('*.js'))
    shotglass.add_static_paths(glob('*.json'))
    shotglass.run_server()
