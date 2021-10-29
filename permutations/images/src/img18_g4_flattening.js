/* img18_g4_flattening.js
 *
 * Render an animation of the G_4 permutohedron being flattened / exploded to a
 * 2d version. This is meant as a companion image to the previous circle-scan
 * images.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

// XXX Are all of these needed?

// I'm currently designing things to look good at size 500x500 per svg.
let size = 500;

let lastTs = null;
let totalSeconds = 0;
let zDist = 4.8;

let [rMin, rMax] = [0.1, 0.9];

let selfAnimTime = 10.0;
let startPts  = null;
let endPts    = null;
let transMat  = null;

let slider = document.getElementById('slider');


// ______________________________________________________________________
// Functions

function drawFrame(ts) {
    window.requestAnimationFrame(drawFrame);

    let b = 0;
    if (lastTs !== null) {
        b = Math.min(1, totalSeconds / selfAnimTime);
        let a = 1 - b;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < space.ctx.pts[0].length; j++) {
                space.ctx.pts[i][j] = a * startPts[j][i] + b * endPts[j][i];
            }
        }
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;

    slider.value = b;
    b = b ** 0.8;  // At first rotate quickly, then slow down.
    let T = matrix.mult(transMat, matrix.rotateAroundY(b * Math.PI / 2));
    space.setTransform(T);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup(size, size);

    let [pts, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    let R = vector.len(pts[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.zoom = 1.6;
    space.ctx.dotSize = 0.035;
    space.addPoints(pts);
    space.addLines(lines);

    // Add to the z value of all points.
    transMat = matrix.eye(4);
    transMat[2][3] = zDist;
    space.setTransform(transMat);
    space.setZDist(zDist);

    // Collect data toward the flattened version.
    // The `true` here is for doKeepCoords, since we're mapping in a simple
    // (3d-wise) way than a straight to-2d projection.
    let pts2d = util.explode3DPoints(pts, labels, rMin, rMax, true);
    startPts = pts.slice();
    // Let's map this to the same scale.
    endPts = pts2d.map(x => [0, x[0] / rMax * R, x[1] / rMax * R]);

    window.requestAnimationFrame(drawFrame);
});
