/* img11_permutohedron_g4.js
 *
 * Render a rotating 3d permutohedron of G_4.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
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

    let speed = 1;

    let xRotationsPerSec = speed * 0.01;
    let yRotationsPerSec = speed * 0.05;
    let zRotationsPerSec = speed * 0.0;

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

    let pts   = perm.getG4PointsIn3D();
    let lines = perm.getEdgeIndexesLex(4);
    let faces = perm.getG4FacesIn3D();

    // XXX
    console.log('faces:');
    console.log(faces);

    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);

    window.requestAnimationFrame(drawFrame);
});
