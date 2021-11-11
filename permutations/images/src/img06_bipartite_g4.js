/* img06_bipartite_g4.js
 *
 * Draw G_4 as a bipartite graph.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm2  from './perm2.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.addContainerSwitcher((artist) => {
        perm2.drawBipartiteGn(artist, 4);  // Draw G_4.
        artist.render();
    });

});
