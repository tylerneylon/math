/* cube_2_faces.js
 *
 * Render a rotating cube with space.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as space  from './space.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

let zDist = 8;

let thickStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 10
};


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    // space.setArtist(init.setup());

    init.addContainerSwitcher((artist) => {

        space.reset();
        space.setArtist(artist);

        let [pts, lines, faces] = util.getCubePtsLinesFaces();

        // Style the lines and faces.
        for (let line of lines) line.style = thickStyle;
        faces[0].style = {fill: '#714'};
        faces[5].style = {fill: '#16c'};

        // Add a small degree of fading for the farther-back points and lines.
        space.ctx.fadeRange = [6, 16];
        space.ctx.doDrawBackFaces = true;

        space.ctx.zoom = 3;
        space.addPoints(pts);
        let offset = 15;
        space.addLabels([0, 1, 2, 3, 4, 5, 6, 7], offset);
        space.addLines(lines);
        space.addFaces([faces[0], faces[5]]);

        space.makeDraggable();
        space.ctx.rotationsPerSec = 0.05;
        space.ctx.rotationSign = -1;
        space.setZDist(zDist);
        space.rotateAround([0.3, -1, 0.5]);

        space.animate();
    });
});
