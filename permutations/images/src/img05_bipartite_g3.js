/* img05_bipartite_g3.js
 *
 * Draw G_3 as a bipartite graph.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm   from './perm.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();
    perm.drawBipartiteGn(3);  // Draw G_3.

});
