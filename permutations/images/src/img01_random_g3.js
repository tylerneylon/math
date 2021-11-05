/* img01_random_g3.js
 *
 * Draw G_3 using random points in a circle.
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

    // XXX Work in progress.
    init.setupButtons(['svgButton', 'canvasButton'], console.log);

    perm.drawRandomGn(3);  // Draw G_3.

});
