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
let zAngle = 0;
let lastTs = null;

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 4;


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let xRotationsPerSec = 0.1;
    let yRotationsPerSec = 0.25;
    let zRotationsPerSec = 0.0;

    if (lastTs !== null) {
        xAngle += xRotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        yAngle += yRotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        zAngle += zRotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;

        let t1 = matrix.rotateAroundX(xAngle);
        let t2 = matrix.rotateAroundY(yAngle);
        let t3 = matrix.rotateAroundZ(zAngle);
        let t4 = matrix.eye(4);
        t4[2][3] = zDist;
        // Apply t1, then t2, then t3.  // XXX
        let t = matrix.mult(t4, matrix.mult(t3, matrix.mult(t2, t1)));

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
    let idx = 0;
    let [xStack, yStack] = [[], []];
    let lines = [];
    for (let x = -1; x < 2; x += 2) {
        for (let y = -1; y < 2; y += 2) {
            for (let z = -1; z < 2; z += 2) {
                if (x === -1) xStack.push(idx);
                if (y === -1) yStack.push(idx);
                pts.push([a * x, a * y, a * z]);
                if (x === 1) lines.push([xStack.shift(), idx]);
                if (y === 1) lines.push([yStack.shift(), idx]);
                if (z === 1) lines.push([idx - 1, idx]);
                idx++;
            }
        }
    }

    space.addPoints(pts);
    space.addLines(lines);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);

    window.requestAnimationFrame(drawFrame);
});
