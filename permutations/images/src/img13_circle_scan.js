/* img13_circle_scan.js
 *
 * Render an animated circle that goes around the
 * G_4 permutahedron.
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


// ______________________________________________________________________
// Globals

// XXX needed?
let xAngle = 0;
let yAngle = 0;
let zAngle = 0;
let lastTs = null;

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 8;


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    // XXX
    return;

    window.requestAnimationFrame(drawFrame);
}

function animateCircle() {
    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();

    let [pts, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 15];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);
});
