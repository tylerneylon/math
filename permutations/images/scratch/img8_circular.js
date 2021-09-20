/* img8_circular.js
 *
 * Support different renderings of G_n for a few values of n.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm   from './perm.js';


// ______________________________________________________________________
// Globals

let orderingType = 'plain';
let n = 3;
let defaultStyles = null;


// ______________________________________________________________________
// Functions

// This uses the globals `n` and orderingType to determine how to render
// the graph.
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
      perm.edgeStyle.stroke = '#bbb';
      perm.dotStyle.r = defaultStyles.dotRadius * 0.1;
    } else if (n === 6) {
      perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.2;
      perm.edgeStyle.stroke = '#bbb';
      perm.dotStyle.r = defaultStyles.dotRadius * 0.7;
    } else {
      perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth;
      perm.edgeStyle.stroke = defaultStyles.edgeStroke;
      perm.dotStyle.r = defaultStyles.dotRadius;
    }

    perm.drawCircularGn(n, orderingType);
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

// FUTURE
//
// * Render the node labels in a dot-specific fashion so that they're always
//   outside the circle (lowering overlap with nodes and edges).
//

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();
    setupButtons();

    perm.drawCircularGn(n, orderingType);
});
