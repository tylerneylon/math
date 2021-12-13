/* circle_test.js
 *
 * Verify that I correctly understand how to embed small circles within a larger
 * circle in a certain way.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw2  from './draw2.js';
import * as init   from './init.js';


// ______________________________________________________________________
// Globals

let n = 4;
let artist = null;


// ______________________________________________________________________
// Functions

// Given the number of small circles we want to fit inside a unit circle
// (and in a ring just inside the circumference), this returns the radius
// of each smaller circle.
function findSmallRadius(n) {
    return 1 / (1 + 1 / Math.sin(Math.PI / n))
}

// This uses the global `n` to determine how to render the circle.
function refreshCircles() {

    const svg = document.getElementById('svg');
    svg.replaceChildren();

    let scale = 0.9;
    let bigCircleStyle = {
        stroke: 'transparent',
        fill:   '#888'
    };
    let smallCircleStyle = {
        stroke: 'transparent',
        fill:   '#44f'
    };

    artist.addCircle({x: 0, y: 0}, scale, bigCircleStyle);

    let angle = 0;
    let r = findSmallRadius(n);
    let R = 1 - r;
    for (let i = 0; i < n; i++) {
        let x = scale * R * Math.cos(angle);
        let y = scale * R * Math.sin(angle);
        artist.addCircle({x, y}, scale * r, smallCircleStyle);
        angle += (2 * Math.PI / n);
    }
}

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

function setupButtons() {

    let nIds = ['n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'n11'];
    let nElts = getButtons(nIds);
    for (let i = 0; i < nElts.length; i++) {
        let button = nElts[i];
        button.onclick = function () {
            activateOneInGroup(button, nElts);
            n = i + 4;
            refreshCircles();
        };
    }

}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    artist = init.setup2();
    setupButtons();

    refreshCircles();
});
