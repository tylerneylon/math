/* circle_test2.js
 *
 * Similar to circle_test1, except that we'll surround a permutohedron.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm2  from './perm2.js';
import * as space2 from './space2.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

let lastTs = null;
let R = Math.sqrt(30);
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

    let [pts, labels]   = perm2.getG4PointsIn3D();
    let [lines, slices] = perm2.getEdgeIndexesLex(4);

    R = vector.len(pts[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space2.ctx.fadeRange = [6, 15];

    space2.ctx.zoom = 1.8;
    space2.setArtist(artist);
    space2.addPoints(pts);
    space2.addLines(lines);

    // Add the circle.
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
