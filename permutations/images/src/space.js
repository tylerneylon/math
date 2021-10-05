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
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals.

export var ctx = {};

// ctx.pts will be a matrix; each column is an affine point.
ctx.pts = [[], [], [], []];
ctx.dots = [];  // This will contain DOM svg circles, one per point.
ctx.outlines = [];

ctx.doBackoff = false;

ctx.lines = [];  // This will contain {from, to, elt} objects.

ctx.faces = [];  // This will contain [pt1, pt2, .., ptn, 'style'] arrays.
ctx.normals = [[], [], [], []];  // This will be a matrix of face normals.
ctx.faceCenters = [];
ctx.facePolygons = [];

// XXX
ctx.normalLinePts = [[], [], [], []];
ctx.normalLines = [];

ctx.transform = matrix.eye(4);

export let dotStyle = {
    stroke: 'transparent',
    fill:   '#888',
    r: 3
};

export let outlineStyle = {
    stroke: 'transparent',
    fill:   '#fff',
    r: 5
};

export let lineStyle = {
    stroke: '#888',
    fill:   'transparent',
    'stroke-width': 0.3
};

export let normalLineStyle = {
    stroke: '#f00',
    fill:   'transparent',
    'stroke-width': 1
};

export let facePolyStyle = {
    stroke: 'transparent',
    fill:   '#fff8',
    'stroke-width': 1
};

let eyeZ = 0.001;

// Groups.
let mainGroup    = null;
let dotGroup     = null;
let outlineGroup = null;
let edgeGroup    = null;


// ______________________________________________________________________
// Internal functions.

function getXYArray(pts) {
    // Transform all points.
    let p = matrix.mult(ctx.transform, pts);

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
            let C = 0.95;
            from = {x: cx - hdx * C, y: cy - hdy * C};
            to   = {x: cx + hdx * C, y: cy + hdy * C};
        }
        draw.moveLine(line.elt, from, to);
    }

    orderEltsByZ(xys);

    // XXX
    for (let i = 0; i < /* 2 */ ctx.faces.length; i++) {
        let face = ctx.faces[i];
        // console.log(`i = ${i}`, 'face:', face);  // XXX
        let faceXYs = [];
        for (let j = 0; j < face.length; j++) faceXYs.push(xys[face[j]]);
        draw.movePolygon(ctx.facePolygons[i], faceXYs);
    }

    // XXX
    xys = getXYArray(ctx.normalLinePts);
    for (let i = 0; i < xys.length; i += 2) {
        let line = ctx.normalLines[i / 2];
        if (line === null) {
            ctx.normalLines[i / 2] = draw.line(
                xys[i],
                xys[i + 1],
                normalLineStyle
            );
        } else {
            draw.moveLine(line, xys[i], xys[i + 1]);
        }
    }
}

function orderEltsByZ(xys) {
    let items = [];
    for (let i = 0; i < xys.length; i++) {
        let item = {
            z: xys[i].z,
            elt: ctx.dots[i],
            outline: ctx.outlines[i],
            deps: []
        };
        item.elt.remove();
        item.outline.remove();
        items.push(item);
    }
    for (let line of ctx.lines) {
        let item = {
            z: (xys[line.from].z + xys[line.to].z) * 0.5,
            elt: line.elt
        };
        item.elt.remove();
        items[line.from].deps.push(line.elt);
        items[line.to].deps.push(line.elt);
    }
    // Sort from high z to low z.
    // We do it this way because we want the highest-z element to be farthest
    // back, aka first, in the child list of the mainGroup svg parent.
    // First children are rendered to appear behind later children.
    items.sort((item1, item2) => item2.z - item1.z);
    for (let item of items) {
        // Add any dependencies, eg lines adjacent to a dot.
        for (let dep of item.deps) {
            if (!dep.parentElement) mainGroup.appendChild(dep);
        }
        if (item.outline) mainGroup.appendChild(item.outline);
        mainGroup.appendChild(item.elt);
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
    mainGroup    = draw.add('g');
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

function addAnyNewNormals() {
    for (let i = ctx.normals[0].length; i < ctx.faces.length; i++) {

        let face = ctx.faces[i];
        let P = matrix.transpose(ctx.pts);

        console.assert(face.length > 2, 'Faces need at least 3 points.');

        // Find the center of the face (for debugging).
        let center = Array(4).fill(0);
        for (let j = 0; j < face.length; j++) {
            center = center.map((x, i) => x + P[face[j]][i]);
        }
        center = center.map(x => x / face.length);
        ctx.faceCenters.push(center);

        // XXX
        console.log('Calculated face center:');
        console.log(center);

        // Find the normal direction.
        let a = vector.sub(P[face[1]], P[face[0]]);  // a = p1 - p0.
        let b = vector.sub(P[face[2]], P[face[0]]);  // b = p2 - p0.
        let n = vector.unit(vector.cross(a, b));     // n = unit(a x b).

        // Choose the sign of n so that it points away from the origin.
        // This assumes the overall shape is convex, and that the origin is on
        // the interior of the shape.
        let sign = Math.sign(vector.dot(n, center));
        n = n.map(x => x * sign);

        n.push(0);  // Make n a length-4 vector.
        for (let j = 0; j < 4; j++) ctx.normals[j].push(n[j]);

        // XXX
        console.log('Calculated face normal:');
        console.log(n);

        console.log('_____________________');
        console.log('Help with a sanity check:');
        console.log('p0:');
        console.log(P[face[0]]);
        console.log('p1:');
        console.log(P[face[1]]);
        console.log('p1 - p0 (a):');
        console.log(a);
        console.log('a . n:');
        console.log(vector.dot(a, n));
        console.log('b . n:');
        console.log(vector.dot(b, n));

        // XXX
        // Add data to visually render normal lines.
        // This is intended as temporary debug code.
        for (let j = 0; j < 4; j++) {
            ctx.normalLinePts[j].push(center[j]);
            ctx.normalLinePts[j].push(center[j] + 0.1 * n[j]);
            ctx.normalLines.push(null);
        }

        // Change coordinates so we can:
        //  (a) Ensure the points are essentially planar, and
        //  (b) sort them by angle around their center.
        // This works as intended whenever the points form a convex shape.
        let S = matrix.rand(3, 3);
        for (let j = 0; j < 3; j++) S[0][j] = n[j];
        let Q = matrix.transpose(matrix.qr(matrix.transpose(S))[0]);
        // Build the matrix faceP whose columns are the (3d) points in `face`.
        let faceP = [];
        for (let j = 0; j < face.length; j++) faceP.push(P[face[j]]);
        faceP = matrix.transpose(faceP).slice(0, 3);
        // let faceP = [[], [], []];
        // for (let j = 0; j < face.length; j++) {
        //     for (let k = 0; k < 3; k++) faceP[k].push(P[k][face[j]]);
        // }
        console.log('faceP:'); matrix.pr(faceP);
        let T = matrix.mult(Q, faceP);
        console.log('T:'); matrix.pr(T, 9);
        // Confirm that the points are essentially planar.
        let [hi, lo] = [Math.max(...T[0]), Math.min(...T[0])];
        console.assert(hi - lo < 0.001, 'Expected face points to be planar.');
        let angles = [];
        for (let j = 0; j < face.length; j++) {
            angles.push({
                angle: Math.atan2(T[2][j], T[1][j]),
                index: face[j]
            });
        }
        // debugger;
        angles.sort((a, b) => b.angle - a.angle);
        ctx.faces[i] = [];
        for (let item of angles) ctx.faces[i].push(item.index);

        ctx.facePolygons.push(draw.polygon([], facePolyStyle));

        // Confirm that the points are essentially planar.
        // TODO

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

// This expects each face to be an array of indexes into `pts`.
// Each face is expected to live in a plane, and it's expected that the points
// are convex and listed counterclockwise.
export function addFaces(faces) {
    ctx.faces.push(...faces);

    // XXX
    // debugger;

    addAnyNewNormals();
}

export function setTransform(t) {
    ctx.transform = t;
    updatePoints();
}

