/* space.js
 *
 * Functions to assist with 3d rendering.
 *
 */


// TODO
//  * Refactor so that there is less code redundancy across
//    initial dot/line placement and setting a new transform.
//  * Ensure initial render is consistent with follow-ups.

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
ctx.outlines = [];

ctx.doBackoff = false;

ctx.lines = [];  // This will contain {from, to, elt} objects.

ctx.transform = matrix.eye(4);

export let dotStyle = {
    stroke: 'transparent',
    fill:   '#888',
    r: 3
};

// XXX
// TODO
// Make outlines optional. For now I'm making them invisible.
export let outlineStyle = {
    stroke: 'transparent',
    //fill:   '#fff',
    fill:   'transparent',  // XXX
    r: 5
};


export let lineStyle = {
    stroke: '#888',
    fill:   'transparent',
    'stroke-width': 0.3
};

let eyeZ = 0.001;

// Groups.
let dotGroup     = null;
let outlineGroup = null;
let edgeGroup    = null;


// ______________________________________________________________________
// Internal functions.

function getXYArray(pts) {
    // Transform all points.
    let p = matrix.mult(ctx.transform, ctx.pts);

    // Apply perspective.
    let xyArray = [];
    for (let i = 0; i < p[0].length; i++) {
        let [x, y, z] = [p[0][i], p[1][i], p[2][i]];
        xyArray.push({x: x / z, y: y / z, z, isVisible: z >= eyeZ});
    }
    return xyArray;
}

function updatePoints() {

    let xys = getXYArray(ctx.pts);

    for (let i = 0; i < xys.length; i++) {
        let r = 0.02 / xys[i].z;
        let outlineR = 0.04 / xys[i].z;
        draw.moveCircle(ctx.dots[i], xys[i], r);
        draw.moveCircle(ctx.outlines[i], xys[i], outlineR);
        ctx.dots[i].hidden = !xys[i].isVisible;
        ctx.outlines[i].hidden = !xys[i].isVisible;
    }

    for (let line of ctx.lines) {
        let [from, to] = [xys[line.from], xys[line.to]];
        if (ctx.doBackoff) {
            let [cx, cy] = [
                (to.x + from.x) / 2,
                (to.y + from.y) / 2
            ];
            let [hdx, hdy] = [  // "hd" is "half delta"
                (to.x - from.x) / 2,
                (to.y - from.y) / 2
            ];
            let C = 0.8;
            from = {x: cx - hdx * C, y: cx - hdy * C};
            to   = {x: cx + hdx * C, y: cx + hdy * C};
        }
        draw.moveLine(line.elt, from, to);
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

function ensureGroupsExist() {
    if (dotGroup !== null) return;
    edgeGroup    = draw.add('g');
    outlineGroup = draw.add('g');
    dotGroup     = draw.add('g');
}

function addAnyNewDots() {
    ensureGroupsExist();
    for (let i = ctx.dots.length; i < ctx.pts[0].length; i++) {
        let pt = calculateDrawPt(matrix.getColumn(ctx.pts, i));
        let elt        = draw.circle(pt, dotStyle, dotGroup);
        let outlineElt = draw.circle(pt, outlineStyle, outlineGroup);
        ctx.dots.push(elt);
        ctx.outlines.push(outlineElt);
        if (!pt.isVisible) {
            elt.hidden = true;
            outlineElt.hidden = true;
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

// This expects `lines` to be an array of {from, to} objects, where `from` and
// `to` are indexes into the `pts` array. Each line object may also have an
// optional `style` key, which indicates the style overrides for that line.
export function addLines(lines, doBackoff) {
    ensureGroupsExist();
    if (doBackoff) ctx.doBackoff = true;
    for (let line of lines) {
        let fromPt = getXYArray(matrix.getColumn(ctx.pts, line.from))[0];
        let toPt   = getXYArray(matrix.getColumn(ctx.pts, line.to))[0];
        let style  = Object.assign({}, lineStyle, line.style);
        line.elt   = draw.line(fromPt, toPt, style, edgeGroup);
        ctx.lines.push(line);
    }
}

export function setTransform(t) {
    ctx.transform = t;
    updatePoints();
}

