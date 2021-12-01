/* img10_recursive.js
 *
 * Render G_n so it is visually recursive, with each instance of G_{n-1} being
 * visible within G_n.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm2  from './perm2.js';


// ______________________________________________________________________
// Globals

let orderingType = 'plain';
let n = 4;
let defaultStyles = null;
let _artist = null;


// ______________________________________________________________________
// Functions

// This uses the global `n` to determine how to render the graph.
function refreshGraph(artist) {

    if (artist === undefined) {
        artist = _artist;
    } else {
        _artist = artist;
    }

    artist.clear();

    let noListeners    = false;

    if (defaultStyles === null) {
        defaultStyles = {};
        defaultStyles.edgeWidth = perm2.edgeStyle['stroke-width'];
        defaultStyles.edgeStroke = perm2.edgeStyle.stroke;
        defaultStyles.dotRadius = perm2.dotStyle.r;
        defaultStyles.dotOutlineRadius = perm2.outlineStyle.r;

        perm2.renderCtx.edgeWeighting = 'recursive';
    }

    if (n === 7) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.02;
        perm2.edgeStyle.stroke = '#aaa';
        perm2.dotStyle.r     = defaultStyles.dotRadius * 0.2;
        perm2.outlineStyle.r = defaultStyles.dotRadius * 0.4;
        perm2.renderCtx.labelStyle = 'mainOnly';
        noListeners = true;
    } else if (n === 6) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.2;
        // perm2.edgeStyle.stroke = '#bbb';
        perm2.dotStyle.r     = defaultStyles.dotRadius * 0.4;
        perm2.outlineStyle.r = defaultStyles.dotRadius * 0.6;
        perm2.renderCtx.labelStyle = 'mainOnly';
    } else if (n === 5) {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.4;
        perm2.edgeStyle.stroke = defaultStyles.edgeStroke;
        perm2.dotStyle.r     = defaultStyles.dotRadius * 0.7;
        perm2.outlineStyle.r = defaultStyles.dotRadius * 1.1;
        perm2.renderCtx.labelStyle = 'mainOnly';
    } else {
        perm2.edgeStyle['stroke-width'] = defaultStyles.edgeWidth;
        perm2.edgeStyle.stroke = defaultStyles.edgeStroke;
        perm2.dotStyle.r     = defaultStyles.dotRadius;
        perm2.outlineStyle.r = defaultStyles.dotOutlineRadius;
        perm2.renderCtx.labelStyle = 'all';
    }

    perm2.drawRecursiveGn(artist, n, {orderingType, noListeners});
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
    setupButtons();
    init.addContainerSwitcher(refreshGraph);
});
