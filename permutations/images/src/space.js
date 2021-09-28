/* space.js
 *
 * Functions to assist with 3d rendering.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as matrix from './matrix.js';


// ______________________________________________________________________
// Globals.

export var ctx = {};
// ctx.pts will be a matrix; each column is an affine point.
ctx.pts = [[], [], [], []];
ctx.dots = [];  // This will contain DOM svg circles, one per point.
ctx.transform = matrix.eye(4);

export let dotStyle = {
    stroke: 'transparent',
    fill:   '#888',
    r: 3
};

let eyeZ = 0.001;


// ______________________________________________________________________
// Internal functions.

function updateDots() {
    // Transform all points.
    let p = matrix.mult(ctx.transform, ctx.pts);

    // Apply perspective.
    for (let i = 0; i < p[0].length; i++) {
        let [x, y, z] = [p[0][i], p[1][i], p[2][i]];
        x /= z;
        y /= z;
        draw.setCenter(ctx.dots[i], {x, y});
        ctx.dots[i].hidden = z < eyeZ;
    }
}

// This expects `pt` to be a 4d column vector.
function calculateDrawPt(pt) {

    // Transform the point.
    let p = matrix.mult(ctx.transform, pt);

    let [x, y, z] = [p[0][0], p[1][0], p[2][0]];

    let isVisible = z >= eyeZ;

    // Apply perspective.
    if (z !== 0) {
        x /= z;
        y /= z;
    }

    return {x, y, isVisible};
}

function appendPoint(pt) {
    console.assert(pt.length === 3, 'Expected 3d points.');

    for (let i = 0; i < 3; i++) ctx.pts[i].push(pt[i]);
    ctx.pts[3].push(1);
}

function addAnyNewDots() {
    for (let i = ctx.dots.length; i < ctx.pts[0].length; i++) {
        // XXX
        console.log('Considering column:');
        console.log(matrix.pr(matrix.getColumn(ctx.pts, i)));
        let pt = calculateDrawPt(matrix.getColumn(ctx.pts, i));
        let elt = draw.circle(pt, dotStyle);
        ctx.dots.push(elt);
        if (!pt.isVisible) {
            elt.hidden = true;
        }
    }
}


// ______________________________________________________________________
// Public functions.

// This expects `pts` to be an array of 3d points, with each point being an
// array of 3 numbers.
export function addPoints(pts) {
    for (let pt of pts) {
        appendPoint(pt);
    }
    addAnyNewDots();
}

export function setTransform(t) {
    ctx.transform = t;
    updateDots();
}

