## Commands useful for working with images.

### Converting from an html-based svg to an svg file.

I found that I can use Chrome's web inspecter to copy out the post-js
svg elements, and paste those directly into an svg file, like this:

* Use cmd-shift-C in Chrome to select and inspect the svg element.
* Right-click the svg element in the inspector, choose Copy > Copy element.
* In a shell, run, for example, `pbpaste > my_image.svg`.

### Getting a png file to a standardized layout.

This includes a fixed width and height that comes from an image with
a different size and aspect ratio (in this example, from square-ish to wide),
and padding with some added white pixels.


    convert my_image.png -resize x946 my_image.png
    convert my_image.png -gravity center -extent 1540x my_image.png 
