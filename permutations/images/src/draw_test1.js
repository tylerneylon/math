/* draw_test1.js
 *
 * Start to develop a new drawing system that can work with both svg and canvas
 * elements.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw2  from './draw2.js';


// ______________________________________________________________________
// Globals


// ______________________________________________________________________
// Functions

function setupEltWithId(id) {
    let size = 400;

    let artist = draw2.inId(id, 400);
    artist.setCoordLimits(-1, 1);
    artist.addCircle({x: 0, y: 0}, 0.1);
    artist.addCircle({x: 0.4, y: 0}, 0.1);
    artist.addCircle({x: 0, y: 0.5}, 0.1);

    return artist;
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {
    let svgArtist    = setupEltWithId('svg');
    let canvasArtist = setupEltWithId('canvas');

    canvasArtist.render();
});
