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


// ______________________________________________________________________
// Functions

// This uses the globals `n` and useLexOrdering to determine how to render
// the graph.
function refreshGraph() {

    const svg = document.getElementById('svg');
    svg.replaceChildren();

    if (n > 5) {
      perm.edgeStyle['stroke-width'] *= 0.2;
      perm.edgeStyle.stroke = '#bbb';
      perm.dotStyle.r *= 0.7;
    }

    perm.drawCircularGn(n, useLexOrdering);
}

function setupButtons() {
    let nIds = ['n3', 'n4', 'n5', 'n6'];
    for (let i = 0; i < nIds.length; i++) {
        let nId = nIds[i];
        let button = document.getElementById(nId);
        button.onclick = function () {
            console.log('Re-render for n=', i + 3);
            n = i + 3;
            refreshGraph();
        };
    }
}


// ______________________________________________________________________
// Main

// TODO HERE
//
// * Make the style consistent for each given n.
// * Make the layout buttons functional.
// * Try to make the style (eg edge weights) look decent for all n.
// * Clearly show with buttons what is active.
//

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();
    setupButtons();

    perm.drawCircularGn(n, useLexOrdering);
});
