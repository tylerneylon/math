/* img07_bipartite_g5.js
 *
 * Draw G_5 as a bipartite graph.
 *
 */


// ______________________________________________________________________
// Imports

import * as init from './init.js';
import * as perm from './perm.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    perm.edgeStyle['stroke-width'] *= 0.3;
    perm.edgeStyle.stroke = '#bbb';
    perm.dotStyle.r *= 0.7;

    init.addContainerSwitcher((artist) => {
        perm.drawBipartiteGn(artist, 5);  // Draw G_5.
        artist.autorender();
    });

});
