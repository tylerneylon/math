/* img3_random_g5.js
 *
 * Draw G_5 using random points in a circle.
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
    perm.drawRandomGn(5);  // Draw G_5.

});
