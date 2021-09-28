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

let angle  = 0;
let circle = null;
let R      = 0.8;
let lastTs = null;

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let rotationsPerSec = 0.5;

    if (circle === null) {
        let r = 0.1;
        circle = draw.circle({x: R, y: 0}, r, circleStyle);
    } else {
        angle += rotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        let center = {x: R * Math.cos(angle), y: R * Math.sin(angle)};
        draw.setCenter(circle, center);
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

    // XXX
    console.log('pts', pts);

    space.addPoints(pts);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = 3;
    // for (let i = 0; i < 3; i++) t[i][3] = 3;

    space.setTransform(t);
});
