/* init.js
 *
 * Simplify drawing startup.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as draw2  from './draw2.js';
import * as perm   from './perm.js';
import * as random from './random.js';


// ______________________________________________________________________
// Globals and constants

let xSize = 750, ySize = 750;
let containerType = 'svg';  // Could also be 'canvas'.


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

// This assumes the existence of a button group with ids svgButton and
// canvasButton.
export function enableContainerSwitcher() {

    function buttonHandler(to) {

        let containerTypes = ['svg', 'canvas'];
        let from = containerTypes.indexOf(containerType);
        if (from === to) return;

        let oldElt = document.getElementById(containerType);
        let w = parseInt(oldElt.getAttribute('width'));
        let h = parseInt(oldElt.getAttribute('height'));

        let newType = containerTypes[to];
        let newElt = document.createElement(newType);
        newElt.id = newType;
        oldElt.replaceWith(newElt);
        containerType = newType;

        setup2(w, h, containerType);
    }

    setupButtons(['svgButton', 'canvasButton'], buttonHandler);

}

export function setup(w, h, containerId) {

    if (containerId === undefined) containerId = 'svg';

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
    const container = document.getElementById(containerId);
    draw.addAttributes(container, {width: w, height: h});
    draw.setSVG(container);
    draw.drawInFront();
    draw.setOrigin({x: w / 2, y: h / 2});
    draw.setScale(toCanvasScale);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);

    return container;
}

// XXX TODO Eventually have this one completely replace setup().
export function setup2(w, h, containerId) {

    // Support that we only receive containerId as an input.
    if (typeof w === 'string') {
        containerId = w;
        w = undefined;
    }

    if (containerId === undefined) containerId = 'svg';

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

    const artist = draw2.inId(containerId);
    artist.setSize(w, h);
    artist.setCoordLimits(-1, 1);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);

    return artist;
}
