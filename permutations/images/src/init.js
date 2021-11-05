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


// ______________________________________________________________________
// Internal functions

// A helper function for button groups.
// Get a list of elements given a list of ids.
function getButtons(buttonIds) {
    let buttonElts = [];
    for (let id of buttonIds) {
        buttonElts.push(document.getElementById(id));
    }
    return buttonElts;
}

// A helper function for button groups.
// Add the class 'btn-active' to buttonElt, while ensuring that class is absent
// from the other elements in groupElts.
function activateOneInGroup(buttonElt, groupElts) {
    for (let elt of groupElts) {
        elt.classList.remove('btn-active');
    }
    buttonElt.classList.add('btn-active');
}


// ______________________________________________________________________
// Public functions

// This sets up click handlers for the buttons listed in the array `ids`.
// The click handler for the ith (0-indexed) button will first modify the style
// of the button group to show which is active, and then call `handler` with
// the value i.
export function setupButtons(ids, handler) {
    let buttons = getButtons(ids);
    for (let i = 0; i < ids.length; i++) {
        let button = buttons[i];
        button.onclick = function () {
            activateOneInGroup(button, buttons);
            handler(i);
        };
    }
}

export function setup(w, h, svgId) {

    if (svgId === undefined) svgId = 'svg';

    if (h === undefined) h = w;

    if (w === undefined) {
        w = xSize;
        h = ySize;
    }
    // If we multiply logical units * toCanvasScale, then we map from [-1, 1]^2
    // into a square that just fits, centered, in the canvas.
    let canvasSize = Math.min(w, h);
    let toCanvasScale = canvasSize / 2.0;

    // Set up graphic components.
    const svg = document.getElementById(svgId);
    draw.addAttributes(svg, {width: w, height: h});
    draw.setSVG(svg);
    draw.drawInFront();
    draw.setOrigin({x: w / 2, y: h / 2});
    draw.setScale(toCanvasScale);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);

    return svg;
}
