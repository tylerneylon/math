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

let useLexOrdering = false;
let n = 3;
let defaultStyles = null;


// ______________________________________________________________________
// Functions

// This uses the globals `n` and useLexOrdering to determine how to render
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

    perm.drawCircularGn(n, useLexOrdering);
}

function setupButtons() {
    let nIds = ['n3', 'n4', 'n5', 'n6', 'n7'];
    for (let i = 0; i < nIds.length; i++) {
        let nId = nIds[i];
        let button = document.getElementById(nId);
        button.onclick = function () {
            for (let otherId of nIds) {
                document.getElementById(otherId).classList.remove('btn-active');
            }
            button.classList.add('btn-active');
            n = i + 3;
            refreshGraph();
        };
    }
    let [lexBtn, plainBtn] = [
        document.getElementById('lex'),
        document.getElementById('plain')
    ];
    lexBtn.onclick = function () {
        plainBtn.classList.remove('btn-active');
        lexBtn.classList.add('btn-active');
        useLexOrdering = true;
        refreshGraph();
    };
    plainBtn.onclick = function () {
        lexBtn.classList.remove('btn-active');
        plainBtn.classList.add('btn-active');
        useLexOrdering = false;
        refreshGraph();
    };
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

    perm.drawCircularGn(n, useLexOrdering);
});
