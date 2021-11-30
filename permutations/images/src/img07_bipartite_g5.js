/* img07_bipartite_g5.js
 *
 * Draw G_5 as a bipartite graph.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm2  from './perm2.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    perm2.edgeStyle['stroke-width'] *= 0.3;
    perm2.edgeStyle.stroke = '#bbb';
    perm2.dotStyle.r *= 0.7;

    init.addContainerSwitcher((artist) => {
        perm2.drawBipartiteGn(artist, 5);  // Draw G_5.
        artist.autorender();
    });

});
