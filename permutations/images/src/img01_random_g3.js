/* img01_random_g3.js
 *
 * Draw G_3 using random points in a circle.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as perm2  from './perm2.js';


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let artist = init.setup2();

    // XXX Work in progress.
    init.enableContainerSwitcher();

    perm2.drawRandomGn(artist, 3);  // Draw G_3.
});
