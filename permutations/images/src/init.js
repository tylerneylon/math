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

export function addContainerSwitcher(size, numContainers, setupWithArtist) {
    let doc  = document;
    let body = doc.body;
    let make = doc.createElement.bind(doc);

    let main = doc.getElementById('main');
    if (!main) main = body;

    main.appendChild(make('br'));

    let bigDiv = make('div');

    let span = make('span');
    span.innerHTML = 'container: ';
    bigDiv.appendChild(span);

    let div = make('div');
    div.classList.add('btn-group');
    let b1  = make('button');
    b1.innerHTML = 'svg';
    b1.id = 'svgButton';
    b1.classList.add('btn-active');
    div.appendChild(b1);
    let b2 = make('button');
    b2.innerHTML = 'canvas';
    b2.id = 'canvasButton';
    div.appendChild(b2);
    bigDiv.appendChild(div);

    main.appendChild(bigDiv);

    enableContainerSwitcher(size, numContainers, setupWithArtist);
}

// This assumes the existence of a button group with ids svgButton and
// canvasButton.
// Both `size` and numContainers are optional BUT if you want to send in
// numContainers, then you must also include size.
export function enableContainerSwitcher(size, numContainers, setupWithArtist) {

    if (typeof numContainers === 'function') {  // We got (size, setup).
        setupWithArtist = numContainers;
        numContainers = undefined;
    }
    if (typeof size === 'function') {  // Only receive setupWithArtist.
        setupWithArtist = size;
        size            = undefined;
        numContainers   = undefined;
    }
    if (numContainers === undefined) numContainers = 1;

    // Sanity check; avoid us interpreting a numContainers as a size.
    console.assert(size > 3);

    function buttonHandler(to) {

        let containerTypes = ['svg', 'canvas'];
        let from = containerTypes.indexOf(containerType);
        if (from === to) return;

        let newType = containerTypes[to];
        let artists = [];

        for (let i = 1; i <= numContainers; i++) {

            let containerId = containerType;
            if (numContainers > 1) containerId += i;
            let oldElt = document.getElementById(containerId);
            // let rect = oldElt.getBoundingClientRect();
            const w = parseFloat(oldElt.style.width);
            const h = parseFloat(oldElt.style.height);

            let newElt = null;
            if (newType === 'canvas') newElt = document.createElement(newType);
            if (newType === 'svg') {
                let ns = 'http://www.w3.org/2000/svg';
                newElt = document.createElementNS(ns, 'svg');
            }

            newElt.style.backgroundColor = '#fff';
            let newId = newType;
            if (numContainers > 1) newId += i;
            newElt.id = newId;
            oldElt.replaceWith(newElt);

            if (newType === 'svg') {
                newElt.setAttribute('version', '1.1');
                newElt.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }

            artists.push(setup2(w, h, newId));
        }
        containerType = newType;
        setupWithArtist(...artists);
    }

    setupButtons(['svgButton', 'canvasButton'], buttonHandler);

    let artists = [];
    for (let i = 1; i <= numContainers; i++) {
        let containerId = (numContainers === 1 ? 'svg' : `svg${i}`);
        artists.push(setup2(size, containerId));
    }
    setupWithArtist(...artists);
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

    // Accept different input combinations.
    if (typeof w === 'string') {  // Support setup(containerId).
        containerId = w;
        w = undefined;
    }
    if (typeof h === 'string') {  // Support setup(size, containerId).
        containerId = h;
        h = w;
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
