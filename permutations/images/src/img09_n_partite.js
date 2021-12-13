/* img09_n_partite.js
 *
 * Render G_n with e on the left, and then, one column per magnitude to the
 * right of that.
 *
 */


// ______________________________________________________________________
// Imports

import * as init from './init.js';
import * as perm from './perm.js';


// ______________________________________________________________________
// Globals

let orderingType = 'lex';
let n = 3;
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

    let excludeHitDots = false;
    let noListeners    = false;

    if (defaultStyles === null) {
        defaultStyles = {};
        defaultStyles.edgeWidth = perm.edgeStyle['stroke-width'];
        defaultStyles.edgeStroke = perm.edgeStyle.stroke;
        defaultStyles.dotRadius = perm.dotStyle.r;
    }

    if (n >= 7) {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.02;
        perm.edgeStyle.stroke = '#888';
        perm.dotStyle.r = defaultStyles.dotRadius * 0.7;
        perm.renderCtx.edgeWeighting = 'boldNearE';
        excludeHitDots = true;
        noListeners    = true;
    } else if (n === 6) {
        perm.edgeStyle['stroke-width'] = defaultStyles.edgeWidth * 0.1;
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

    perm.drawNPartiteGn(
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
