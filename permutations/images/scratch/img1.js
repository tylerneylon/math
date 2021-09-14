/* img1.js
 *
 * Draw G_3 using random points in a circle.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as perm   from './perm.js';
import * as random from './random.js';


// ______________________________________________________________________
// Globals and constants

var xSize = 1000, ySize = 1000;

var xMid = xSize / 2;
var yMid = ySize / 2;
var canvasSize = Math.min(xSize, ySize);
// If we multiply logical units * toCanvasScale, then we map from [-1, 1]^2
// into a square that just fits, centered, in the canvas.
var toCanvasScale = canvasSize / 2.0;


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    // Set up graphic components.
    const svg = document.getElementById('svg');
    draw.addAttributes(svg, {width: xSize, height: ySize});
    draw.setSVG(svg);
    draw.drawInFront();
    draw.setOrigin({x: xSize / 2, y: ySize / 2});
    draw.setScale(toCanvasScale);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);

    // For debugging: Draw the unit circle's circumference.
    var lightStyle = {
        stroke: '#f4f4f4',
        fill: 'transparent',
        'stroke-width': 2
    };
    draw.circle({x: 0, y: 0}, 1, lightStyle);

    // Draw G_3.
    perm.drawGn(3);
});
