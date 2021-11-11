/* img03_random_g5.js
 *
 * Draw G_5 using random points in a circle.
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
        perm2.drawRandomGn(artist, 5);  // Draw G_5.
        artist.render();
    });
});
