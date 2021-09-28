/* init.js
 *
 * Simplify drawing startup.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as perm   from './perm.js';
import * as random from './random.js';


// ______________________________________________________________________
// Globals and constants

var xSize = 750, ySize = 750;
// var xSize = 7500, ySize = 7500;

var xMid = xSize / 2;
var yMid = ySize / 2;
var canvasSize = Math.min(xSize, ySize);
// If we multiply logical units * toCanvasScale, then we map from [-1, 1]^2
// into a square that just fits, centered, in the canvas.
var toCanvasScale = canvasSize / 2.0;


// ______________________________________________________________________
// Public functions

export function setup() {
    // Set up graphic components.
    const svg = document.getElementById('svg');
    draw.addAttributes(svg, {width: xSize, height: ySize});
    draw.setSVG(svg);
    draw.drawInFront();
    draw.setOrigin({x: xSize / 2, y: ySize / 2});
    draw.setScale(toCanvasScale);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);
}
