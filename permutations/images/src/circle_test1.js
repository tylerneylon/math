/* circle_test1.js
 *
 * Test the ability to render an outlined circle in an arbitrary 3d position.
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

    let [pts, lines, faces] = util.getCubePtsLinesFaces();

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 15];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);

    // Add the circle.
    // This circle will be just around one face of the cube.
    // Send in center, radius, normal.
    // The normal does not have to be a unit vector when sent in.
    let r = Math.sqrt(2) + 0.01;
    space.addCircle([-1, 0, 0], r, [1, 0, 0]);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);
});
