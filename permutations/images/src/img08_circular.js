/* img08_circular.js
 *
 * Support different renderings of G_n for a few values of n.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm2  from './perm2.js';


// ______________________________________________________________________
// Globals

let orderingType = 'plain';
let n = 3;
let defaultStyles = null;
let _artist = null;


// ______________________________________________________________________
// Functions

// This uses the globals `n` and orderingType to determine how to render
// the graph.
function refreshGraph(artist) {

    if (artist === undefined) {
        artist = _artist;
    } else {
        _artist = artist;
    }

    artist.clear();

    let excludeHitDots = false;
    let noListeners    = false;

    if (defaultStyles === null) {
        defaultStyles = {};
        defaultStyles.edgeWidth = perm2.edgeStyle['stroke-width'];
        defaultStyles.edgeStroke = perm2.edgeStyle.stroke;
        defaultStyles.dotRadius = perm2.dotStyle.r;
    }

    if (n >= 7) {
        excludeHitDots = true;
        noListeners = true;
    }

    if (n === 8) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.001;
        perm2.edgeStyle.stroke = '#555';
        perm2.dotStyle.r = defaultStyles.dotRadius * 0.005;
    } else if (n === 7) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.02;
        perm2.edgeStyle.stroke = '#bbb';
        perm2.dotStyle.r = defaultStyles.dotRadius * 0.1;
    } else if (n === 6) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.2;
        perm2.edgeStyle.stroke = '#bbb';
        perm2.dotStyle.r = defaultStyles.dotRadius * 0.7;
    } else {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth;
        perm2.edgeStyle.stroke = defaultStyles.edgeStroke;
        perm2.dotStyle.r = defaultStyles.dotRadius;
    }

    perm2.drawCircularGn(
        artist,
        n,
        {orderingType, excludeHitDots, noListeners}
    );
    artist.autorender();
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

    let nIds = ['n3', 'n4', 'n5', 'n6', 'n7', 'n8'];
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
    setupButtons();
    init.addContainerSwitcher(refreshGraph);
});
