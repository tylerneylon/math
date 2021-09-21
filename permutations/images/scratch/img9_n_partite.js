/* img9_n_partite.js
 *
 * Render G_n with e on the left, and then, one column per magnitude to the
 * right of that.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm   from './perm.js';


// ______________________________________________________________________
// Globals

let orderingType = 'lex';
let n = 3;
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

    perm.drawNPartiteGn(n);
}

function setupButtons() {
    let nIds = ['n3', 'n4', 'n5', 'n6'];
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
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();
    setupButtons();

    refreshGraph();
});
