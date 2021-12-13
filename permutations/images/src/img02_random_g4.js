/* img02_random_g4.js
 *
 * Draw G_4 using random points in a circle.
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
        perm.drawRandomGn(artist, 4);  // Draw G_4.
        artist.autorender();
    });
});
