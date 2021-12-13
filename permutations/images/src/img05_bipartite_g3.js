/* img05_bipartite_g3.js
 *
 * Draw G_3 as a bipartite graph.
 *
 */


// ______________________________________________________________________
// Imports

import * as init from './init.js';
import * as perm from './perm.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.addContainerSwitcher((artist) => {
        perm.drawBipartiteGn(artist, 3);  // Draw G_3.
        artist.autorender();
    });

});
