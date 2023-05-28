/* two_squares.js
 *
 * Render two square faces to help test face order comparison.
 * This test is designed to require a face-face test that can
 * handle the case when no vertex is inside the other polygon.
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


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    // space.setArtist(init.setup());

    init.addContainerSwitcher((artist) => {

        space.reset();
        space.setArtist(artist);

        let [pts, lines, faces] = util.getCubePtsLinesFaces();

        // Rotate the last 4 points around the x-axis by 45 degrees.
        let R = matrix.rotateAroundX(Math.PI / 4);
        let P = matrix.transpose(pts.slice(4));  // The columns are points.
        P.push([1, 1, 1, 1]);
        let newP = matrix.mult(R, P);
        newP.splice(-1);  // Drop the all-1s 4th dimension.
        newP = matrix.transpose(newP);  // The rows are points.
        pts.splice(4, 4, ...newP);

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
