/* face_and_line.js
 *
 * Render just one face and one separate line.
 * This is to help me test the line-vs-face case when neither
 * line endpoint overlaps the face, but the two overlap in
 * between.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
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

        let pts = [
            [-1, -1, -1],  // 0
            [ 1, -1, -1],  // 1
            [ 1,  1, -1],  // 2
            [-1,  1, -1],  // 3
            [-2,  0,  1],  // 4
            [ 2,  0,  1]   // 5
        ];

        let lines = [{from: 4, to: 5, style: thickStyle}];
        let faces = [[0, 1, 2, 3]];
        faces[0].style = {fill: '#16c'};

        // Add a small degree of fading for the farther-back points and lines.
        space.ctx.fadeRange = [6, 16];
        space.ctx.doDrawBackFaces = true;

        space.ctx.zoom = 3;
        space.addPoints(pts);
        let offset = 15;
        space.addLabels([0, 1, 2, 3, 4, 5], offset);
        space.addLines(lines);
        space.addFaces(faces);

        space.makeDraggable();
        space.ctx.rotationsPerSec = 0.05;
        space.ctx.rotationSign = -1;
        space.setZDist(zDist);
        space.rotateAround([0.3, -1, 0.5]);

        space.animate();
    });
});
