/* img06_bipartite_g4.js
 *
 * Draw G_4 as a bipartite graph.
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
        perm.drawBipartiteGn(artist, 4);  // Draw G_4.
        artist.autorender();
    });

});
