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

    artist.addLine({x: -0.8, y: -0.8}, {x: -0.8, y: -0.4});

    artist.addPolygon([
        [-0.6, -0.6],
        [-0.6, -0.4],
        [-0.4, -0.5]
    ], {'fill': '#666'});

    // Sanity check movePolygon().
    let polygon = artist.addPolygon([[0.5, -0.9], [0.4, -0.9], [0.6, -0.8]]);
    artist.movePolygon(polygon, [[0.5, -0.4], [0.4, -0.4], [0.6, -0.2]]);

    return artist;
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {
    let svgArtist    = setupEltWithId('svg');
    let canvasArtist = setupEltWithId('canvas');

    canvasArtist.render();
});
