/* circle_test1.js
 *
 * Test the ability to render an outlined circle in an arbitrary 3d position.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as space2 from './space2.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

let lastTs = null;
let angle = 0;
let R = Math.sqrt(3);
let totalSeconds = 0;
let zDist = 8;


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let rotationsPerSec = 0.1;

    if (lastTs !== null) {
        let t = Math.sin(totalSeconds * 1.1);
        let x = R * t;

        space2.setCircle([x, 0, 0], Math.sqrt(R * R - x * x), [1, 0, 0]);

        /*
        angle += rotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        let [c, s] = [Math.cos(angle), Math.sin(angle)];
        space2.setCircle([-1, 0, 0], r, [c, s, 0]);
        */

        space2.updatePoints();
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;

    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    const artist = init.setup2();

    let [pts, lines, faces] = util.getCubePtsLinesFaces();

    // Add a small degree of fading for the farther-back points and lines.
    space2.ctx.fadeRange = [6, 15];

    space2.ctx.zoom = 1.8;
    space2.setArtist(artist);
    space2.addPoints(pts);
    space2.addLines(lines);

    // Add the circle.
    // This circle will be just around one face of the cube.
    // Send in center, radius, normal.
    // The normal does not have to be a unit vector when sent in.
    space2.setCircle([-1, 0, 0], 1, [1, 0, 0]);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space2.setTransform(t);
    space2.setZDist(zDist);

    window.requestAnimationFrame(drawFrame);
});
