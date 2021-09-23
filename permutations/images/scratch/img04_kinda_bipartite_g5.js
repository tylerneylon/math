/* img04_kinda_bipartite_g5.js
 *
 * Draw G_5 as a kind-of bipartite graph.
 * This is an interesting fluke where I've organized the points as if
 * they were bipartite, but the particular ordering here (lexicographic)
 * does not actually split them alternatingly into independent sets.
 * What's interesting is that the resulting patterns is somewhat
 * symmetric and pleasing.
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
    let useLexOrdering = true;
    perm.drawBipartiteGn(5, useLexOrdering);  // Draw G_5.

});
