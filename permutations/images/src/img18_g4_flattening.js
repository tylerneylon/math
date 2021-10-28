/* img18_g4_flattening.js
 *
 * Render an animation of the G_4 permutohedron being flattened / exploded to a
 * 2d version. This is meant as a companion image to the previous circle-scan
 * images.
 *
 */


// ______________________________________________________________________
// Imports

// XXX needed?
import * as draw   from './draw.js';
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

let svg1 = null;
let svg2 = null;

let svg1Scale = 0.5;
let svg2Scale = 0.47;

let lastTs = null;
let totalSeconds = 0;
let zDist = 4.8;
let R = 0;

let frameNum = 0;
let showEveryNthFrame = 1;

// Scanning 2d circle parameters.
let circleElt = null;
let [rMin, rMax] = [0.1, 0.9];
let [xMin, xMax] = [null, null];  // These will be based on pts below.

let pts3d       = null;
let labels      = null;
let pts2d       = null;
let pt2dElts    = null;
let lines2d     = null;

let pause = 1.0;

// XXX start new globals
let selfAnimTime = 1.0;
let startPts  = null;
let endPts    = null;
let transform = null;

let circleStyle = {
    stroke: '#66a',
    fill:   'transparent',
    'stroke-width': 8
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {
    window.requestAnimationFrame(drawFrame);

    let doShow = (frameNum % showEveryNthFrame === 0);

    if (lastTs !== null && doShow) {
        let b = Math.min(1, totalSeconds / selfAnimTime);
        let a = 1 - b;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < space.ctx.pts[0].length; j++) {
                space.ctx.pts[i][j] = a * startPts[j][i] + b * endPts[j][i];
            }
        }

        if (a > 0) {
            console.log(`totalSeconds = ${totalSeconds}; a = ${a}; b = ${b}`);
            console.log('space.ctx.pts:');
            matrix.pr(space.ctx.pts);
        }
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;
    frameNum++;
    space.setTransform(transform);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup(size, size);

    let [pts, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    let R = vector.len(pts[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [2, 8.5];
    space.ctx.zoom = 1.6;
    space.ctx.dotSize = 0.035;
    space.addPoints(pts);
    space.addLines(lines);

    // Add to the z value of all points.
    transform = matrix.eye(4);
    transform[2][3] = zDist;
    space.setTransform(transform);
    space.setZDist(zDist);

    // Collect data toward the flattened version.
    pts2d = util.explode3DPoints(pts, labels, rMin, rMax);
    startPts = pts.slice();
    // Let's map this to the same scale.
    endPts = pts2d.map(x => [0, x[0] / rMax * R, x[1] / rMax * R]);

    console.log('startPts:');
    console.log(startPts);
    console.log('endPts:');
    console.log(endPts);

    window.requestAnimationFrame(drawFrame);
});
