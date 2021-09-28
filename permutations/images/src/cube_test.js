/* cube_test.js
 *
 * A test for initial development of space.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as space  from './space.js';


// ______________________________________________________________________
// Globals

let xAngle = 0;
let yAngle = 0;
let lastTs = null;

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let xRotationsPerSec = 0.1;
    let yRotationsPerSec = 0.25;

    if (lastTs !== null) {
        xAngle += xRotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        yAngle += yRotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;

        let t1 = matrix.rotateAroundX(xAngle);
        let t2 = matrix.rotateAroundY(yAngle);
        let t3 = matrix.eye(4);
        t3[2][3] = 3;
        // Apply t1, then t2, then t3.
        let t = matrix.mult(t3, matrix.mult(t2, t1));

        space.setTransform(t);
    }

    lastTs = ts;
    window.requestAnimationFrame(drawFrame);
}

function animateCircle() {
    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();

    // Create an array of 3d points.
    // These will be the corners of the [-a, a]^3 cube.
    let a = 0.8;
    let pts = [];
    for (let x = -1; x < 2; x += 2) {
        for (let y = -1; y < 2; y += 2) {
            for (let z = -1; z < 2; z += 2) {
                pts.push([a * x, a * y, a * z]);
            }
        }
    }

    space.addPoints(pts);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = 3;
    space.setTransform(t);

    window.requestAnimationFrame(drawFrame);
});
