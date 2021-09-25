/* img10_recursive.js
 *
 * Render G_n so it is visually recursive, with each instance of G_{n-1} being
 * visible within G_n.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm   from './perm.js';


// ______________________________________________________________________
// Globals

let orderingType = 'plain';
let n = 4;
let defaultStyles = null;


// ______________________________________________________________________
// Functions

// This uses the global `n` to determine how to render the graph.
function refreshGraph() {

    const svg = document.getElementById('svg');
    svg.replaceChildren();

    if (defaultStyles === null) {
        defaultStyles = {};
        defaultStyles.edgeWidth = perm.edgeStyle['stroke-width'];
        defaultStyles.edgeStroke = perm.edgeStyle.stroke;
        defaultStyles.dotRadius = perm.dotStyle.r;
    }

    if (n === 7) {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.02;
        perm.edgeStyle.stroke = '#888';
        perm.dotStyle.r = defaultStyles.dotRadius * 0.7;
        perm.renderCtx.edgeWeighting = 'boldNearE';
    } else if (n === 6) {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.2;
        perm.edgeStyle.stroke = '#bbb';
        perm.dotStyle.r = defaultStyles.dotRadius * 0.7;
        perm.renderCtx.edgeWeighting = 'default';
    } else if (n === 5) {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.4;
        perm.edgeStyle.stroke = defaultStyles.edgeStroke;
        perm.dotStyle.r = defaultStyles.dotRadius;
        perm.renderCtx.edgeWeighting = 'default';
    } else {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth;
        perm.edgeStyle.stroke = defaultStyles.edgeStroke;
        perm.dotStyle.r = defaultStyles.dotRadius;
        perm.renderCtx.edgeWeighting = 'default';
    }

    perm.drawRecursiveGn(n, orderingType);
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

    let nIds = ['n3', 'n4', 'n5', 'n6', 'n7'];
    let nElts = getButtons(nIds);
    for (let i = 0; i < nElts.length; i++) {
        let button = nElts[i];
        button.onclick = function () {
            activateOneInGroup(button, nElts);
            n = i + 3;
            refreshGraph();
        };
    }

    let orderIds  = ['lex', 'plain', 'random'];
    let orderElts = getButtons(orderIds);
    for (let i = 0; i < orderIds.length; i++) {
        let button = orderElts[i];
        button.onclick = function () {
            activateOneInGroup(button, orderElts);
            orderingType = orderIds[i];
            refreshGraph();
        };
    }
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();
    setupButtons();

    refreshGraph();
});
