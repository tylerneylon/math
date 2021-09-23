#!/bin/bash
#
# This is a script to help verify that the internal comments and names in the
# image files here (the html and js files specific to each image) are
# consistent.

# Verify that each html file refers to its corresponding js file.
for fname in img*.html; do
    jsname=${fname%%.*}.js
    if ! grep -q $jsname $fname; then
        echo Ruh-roh: File $fname does not include $jsname.
    fi
done

# Verify that each js file has a correct top-line comment.
for jsname in img*.js; do
    if ! grep -q $jsname <(head -1 $jsname); then
        echo Poop-a-doop: File $jsname does not mention itself in the top line.
    fi
done

