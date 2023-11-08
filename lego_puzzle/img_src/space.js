/* space.js
 *
 * Functions to assist with 3d rendering.
 *
 */


// TODO
//  * Refactor so that there is less code redundancy across
//    initial dot/line placement and setting a new transform.
//  * Ensure initial render is consistent with follow-ups.
//  * Factor out all z-order-focused functions into a new zorder.js file.
//    (In general, aim to reduce the size and complexity of this file.)

// ______________________________________________________________________
// Imports

import * as matrix from './matrix.js';
import * as sort   from './sort.js';
import * as util   from './util.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals.

export let ctx = {};

let lastTs = null;  // This is the last-seen timestamp; it's used to animate.

let mousedownTs = null;
let xDrag = 0, yDrag = 0;

let doDebugEvents = false;

let preClickMode = 'spinning';
ctx.mode = 'spinning';  // This can also be 'dragging' or 'paused'.

ctx.rotateMat = matrix.eye(4);
ctx.transMat  = matrix.eye(4);

// This determines the axis of rotation.
// By default, the object rotates around the x-axis.
// You can make the shape rotate around the unit vector v by providing here
// a unitary matrix M so that M * v = the x-axis (1, 0, 0).
// Use space.setAngleMat() so the inverse is set for you.
// You can also use space.rotateAround(v) to compute and set these.
ctx.angleMat    = matrix.eye(4);
ctx.angleMatInv = matrix.eye(4);  // This must be the inverse of ctx.angleMat.

ctx.rotationsPerSec = 1;
ctx.rotationSign = 1;

// ctx.pts will be a matrix; each column is an affine point.
ctx.pts = [[], [], [], []];
ctx.dots = [];  // This will contain DOM svg circles, one per point.
ctx.outlines = [];
ctx.dotSize = 0.06;

ctx.lines = [];  // This will contain {from, to, elt} objects.

ctx.doDrawFaces = true;
ctx.doShadeFaces = true;
ctx.doDrawBackFaces = false;

// TODO: Consider supporting this flag.
// For now, we always do this.
// ctx.doConnectFaceEdges = true;

ctx.faces = [];  // This will contain [pt1, pt2, .., ptn, 'style'] arrays.
ctx.normals = [[], [], [], []];  // This will be a matrix of face normals.
ctx.faceCenters = [];
ctx.facePolygons = [];

// This is an off-by-defualt, debug-helping feature.
// When `ctx.doDrawNormalLines` is set to `true`, this will draw small red lines
// along the normals of all faces.
ctx.doDrawNormalLines = false;
ctx.normalLinePts = [[], [], [], []];
ctx.normalLines = [];

ctx.doDrawDots = true;

ctx.circle = null;

ctx.transform = matrix.eye(4);

ctx.zoom = 1;

// When this is null, there is no fading when rendering.
// When this is an array [a, b], with a < b, then points and lines
// beyond distnace b are white, points closer than a are at full darkness (which
// depends on their original style), and points between a and b interpolate
// between these.
ctx.fadeRange = null;

// Slice information; may remain empty all day if unused.
ctx.slices = {};

ctx.edgeHighlightColors = [
    '#d44',
    '#d84',
    '#dd4',
    '#4d4',
    '#4dd',
    '#44d'
].map(util.getStdColor).map(x => x.map(y => y * 0.8));

// This is a cache of the z-ordering from the previous frame.
ctx.prevBackToFront = null;

let lightDir = vector.unit([-1, -1, -2]);

let highlightedFaceElt = null;
let highlightedFaceIndex = -1;
let lastHighlightedFaceIndex = -1;

let artist = null;

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
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 0.3
};

export let thickLineStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 8
};

export let normalLineStyle = {
    stroke: '#f00',
    fill:   'transparent',
    'stroke-width': 1
};

export let facePolyStyle = {
    stroke: 'transparent',
    fill:   '#fffa',
    'stroke-width': 1
};

export let textStyle = {
    stroke: 'transparent',
    fill: '#666',
    'font-family': 'sans-serif',
    'font-size': '16px',
    'pointer-events': 'none'
}

export let whiteStyle = {
    stroke: 'transparent',
    fill:   '#fff',
    'pointer-events': 'none'
};

export let blueStyle = {
    stroke: 'transparent',
    fill:   '#00f',
    'pointer-events': 'none'
};

export let redStyle = {
    stroke: 'transparent',
    fill:   '#f00',
    'pointer-events': 'none'
};

export let greenStyle = {
    stroke: 'transparent',
    fill:   '#0f0',
    'pointer-events': 'none'
};

export let yellowStyle = {
    stroke: 'transparent',
    fill:   '#aa0',
    'pointer-events': 'none'
};

let eyeZ = 0.001;

// Groups.
let mainGroup    = null;
let dotGroup     = null;
let outlineGroup = null;
let edgeGroup    = null;


// ______________________________________________________________________
// Internal functions.

// This is for debugging.
function prObj(obj) {
    for (let [k, v] of Object.entries(obj)) {
        console.log(k, v);
    }
}

function didDrag() {
    let motion = xDrag + yDrag;
    console.log(`didDrag(): motion=${motion}.`);
    return motion > 5;
}

function logEvent(e) {
    if (!doDebugEvents) return;
    console.log(`${e.type} on ${e.target}`);
}

// This is intended to be a method on points returned by getXYArray().
function lineDrawn(lineIdx) {
    this.deps.splice(this.deps.indexOf(lineIdx), 1);
    if (this.deps.length === 0 && ctx.doDrawDots) {
        mainGroup.appendChild(ctx.outlines[this.idx]);
        mainGroup.appendChild(ctx.dots[this.idx]);
        say(`Rendering: dot ${this.idx}`);
    }
}

function getXYArray(pts, doPerspective, doRotate) {

    if (doRotate === undefined) doRotate = true;
    if (doPerspective === undefined) doPerspective = true;

    // Transform all points.
    let T = (doRotate ? ctx.transform : ctx.transMat);
    let p = matrix.mult(T, pts);

    // Apply perspective.
    let xyArray = [];
    for (let i = 0; i < p[0].length; i++) {
        let pt = [p[0][i], p[1][i], p[2][i]];
        let [x, y, z] = pt;
        let w = 1;
        if (doPerspective) w = z / ctx.zoom;
        pt = Object.assign(
            pt,
            {x0: x, y0: y, z0: z, x: x / w, y: y / w, z, w}
        );
        pt.isVisible = (z >= eyeZ);
        pt.lineDrawn = lineDrawn;
        xyArray.push(pt);
    }

    return xyArray;
}

function updateLabelForDot(dot, xy) {
    let offset = 0.01;
    let c = artist.toCanvasScale;

    let s = `translate(${c * xy.x}, ${c * xy.y})`;
    dot.label.setAttribute('transform', `translate(${c * xy.x}, ${c * xy.y})`);
}

// Add the circle if there is one. For now, this will be rendered on top of
// everything else.
function renderCircle() {
    if (!ctx.circle) return;

    console.assert(artist !== null);

    for (let path of ctx.circle.paths) path.remove();
    ctx.circle.paths = [];

    // 1. Find four corners around the circle. We want the near pair of corners
    // to have the same z coordinate, and the same for the far pair.

    // 1.a. Find a basis for the plane of the circle. This will be the rows
    //      of T. T[0] = n (normal); T[1] is orth to z and to n.
    let n = getXYArray(matrix.transpose([ctx.circle.normal]), false, false)[0];
    let matA = matrix.rand(3, 3);
    matA[0] = [n.x, n.y, n.z];
    matA[1][0] =  n.y;
    matA[1][1] = -n.x;
    matA[1][2] = 0;
    matA = matrix.transpose(matA);
    let [Q, R] = matrix.qr(matA);
    let T = matrix.transpose(Q);
    // Ensure T[2] points away from the eye (positive z).
    if (T[2][2] < 0) T[2] = T[2].map(x => -x);

    // 1.b. Find the four corners of the surrounding square.
    let c = getXYArray(matrix.transpose([ctx.circle.center]), false, false)[0];
    c = [c.x, c.y, c.z];
    let r = ctx.circle.radius;
    let [T1, T2] = [vector.scale(T[1], r), vector.scale(T[2], r)];
    let nearMid = vector.sub(c, T2);
    let [near1, near2] = [vector.sub(nearMid, T1), vector.add(nearMid, T1)];
    let farMid = vector.add(c, T2);
    let [far1, far2] = [vector.sub(farMid, T1), vector.add(farMid, T1)];
    let isNearOnLeft = (nearMid[0] / nearMid[2]) < (farMid[0] / farMid[2]);

    // Track some key tangent points.
    let mid = vector.midpoint;
    let [t1, t2, t3, t4] = [
        nearMid, mid(near1, far1), mid(near2, far2), farMid
    ];
    // Apply the perspective transform to all coordinates.
    for (let pt of [t1, t2, t3, t4]) {
        pt[0] /= (pt[2] / ctx.zoom);
        pt[1] /= (pt[2] / ctx.zoom);
        pt.length = 2;
    }
    let C = mid(t1, t4);  // This is the screen-based center of the ellipse.

    // Offset the tangent points and find an eqn for them.
    // We'll find a weight vector w:
    //   w[0] * x^2 + w[1] * xy + w[2] * y^2 = 1.
    // For all points (x, y) on the ellipse.
    // We've dropped the x and y terms by first finding the center pt C.
    [t1, t2, t3, t4] = [t1, t2, t3, t4].map(x => vector.sub(x, C));
    let matB = [t1, t2, t3].map(
        x => [x[0] ** 2, x[0] * x[1], x[1] ** 2]
    );
    let w = matrix.solve(matB, matrix.transpose([[1, 1, 1]]));
    let tanTwoTheta = w[1] / (w[0] - w[2]);
    let theta = Math.atan(tanTwoTheta) / 2;
    let [co, si] = [Math.cos(theta), Math.sin(theta)];

    // Un-rotate the tangent points so we can solve a simpler equation.
    // I've changed the sign of si in here to invoke a reverse rotation.
    [t1, t2, t3, t4] = [t1, t2, t3, t4].map(
        x => [co * x[0] + si * x[1], -si * x[0] + co * x[1]]
    );
    let matC = [t1, t2].map(
        x => [x[0] ** 2, x[1] ** 2]
    );
    w = matrix.solve(matC, matrix.transpose([[1, 1]]));
    let [a, b] = [1 / Math.sqrt(w[0]), 1 / Math.sqrt(w[1])];
    // Now (u/a)^2 + (v/b)^2 = 1, where
    // (u, v) are the coordinates (x, y) rotated by theta:
    //   u = cosT * x - sinT * y
    //   v = sinT * x + cosT * y

    // Find start, end screen coordinates.
    let offset = null;
    if (a > b) {
        offset = vector.scale([co, si], a);
    } else {
        offset = vector.scale([-si, co], b);
    }
    let start = vector.sub(C, offset);
    let end   = vector.add(C, offset);
    let orig  = artist.origin;
    [start, end] = [start, end].map(
        x => vector.add(vector.scale(x, artist.toCanvasScale), orig)
    );
    let degrees = theta / Math.PI * 180;
    for (let i = 0; i <= 1; i++) {
        if (isNearOnLeft ^ (i === 1)) {
            artist.drawInFront();
        } else {
            artist.drawBehind();
        }
        let j = isNearOnLeft ? 0 : 1;
        let xFix = (i === 0 ? 1 : 0);
        const d = `M ${start[0] + xFix} ${start[1]} ` +
                  `A ${a} ${b} ${degrees} 0 ${i} ${end[0] + xFix} ${end[1]}`
        const path = artist.addPath(d, Object.assign({}, ctx.circle.style));
        ctx.circle.paths.push(path);
    }
}

// This applies ctx.fadeRange to stdBaseColor, using z, to arrive a color that
// is a fade from stdBaseColor down to white. The returned value is a color
// string that can be assigned, eg, to a `stroke` or `fill` style attribute.
function getFadeColor(stdBaseColor, z, retObj) {
    for (let i in stdBaseColor) util.ctx.stdColor[i] = stdBaseColor[i];
    if (ctx.fadeRange === null) {
        return util.getColorStr();
    }
    let [a, b] = ctx.fadeRange;
    if (z < a) return util.getColorStr();
    if (z > b) return '#fff';
    let w = 1 - (z - a) / (b - a);
    let c = stdBaseColor;
    util.ctx.stdColor = [
        c[0] * w + (1 - w),
        c[1] * w + (1 - w),
        c[2] * w + (1 - w)
    ];
    if (retObj) {
        if (!retObj.coreFill) retObj.coreFill = [];
        for (let i in util.ctx.stdColor) {
            retObj.coreFill[i] = util.ctx.stdColor[i];
        }
    }
    return util.getColorStr();
}

// XXX TODO proper function description.
// XXX TODO This does not yet handle transparency.
// towardLight is expected to be the cosine similarity between the face's normal
// direction and the direction of the light.
function getShadedFaceColor(baseColor, towardLight) {
    let colorArr = util.getStdColor(baseColor);
    let scale = 1;
    if (ctx.doShadeFaces) {
        for (let i = 0; i < 3; i++) {
            colorArr[i] = Math.max(0, colorArr[i] + 0.5 * towardLight);
        }
        scale = Math.max(1, ...colorArr);
    }
    for (let i = 0; i < 3; i++) {
        util.ctx.stdColor[i] = colorArr[i] / scale;
    }
    return util.getColorStr();
}

function drawNormalLines() {
    let xys = getXYArray(ctx.normalLinePts);
    for (let i = 0; i < xys.length; i += 2) {
        let line = ctx.normalLines[i / 2];
        if (line === null) {
            ctx.normalLines[i / 2] = artist.addLine(
                xys[i],
                xys[i + 1],
                normalLineStyle
            );
        } else {
            artist.moveLine(line, xys[i], xys[i + 1]);
        }
    }
}


// ______________________________________________________________________
// Functions to mathematicize shape geometry.

// Add an equation for the current plane of the given face.
// Every face obeys an equation of the form <a,n>=c, for some unit vector n
// and some constant c. This function sets the values of face.n to such a
// unit vector, and face.c to this constant.
function findFacePlane(face, pts, n) {
    face.n = n.slice(0, 3);  // Drop the 4th coordinate, if present.
    face.c = vector.dot(pts[face[0]], face.n);
}

// This function simplifies access to some information about a given line.
// It sets x, y to be the in-perspective starting point, and dx, dy to be the
// in-perspective delta from start to finish.
// This also sets up the orthonormal basis (a, b, c), in pre-perspective
// coordinates, so that the extended line has the equation:
//   line = {p : <p,a> = 0 and <p,b> = d}
// where the constant d is given by the value line.d.
function findLineEqns(line, pts) {
    line.x  = pts[line.from].x;
    line.y  = pts[line.from].y;
    line.dx = pts[line.to].x - line.x;
    line.dy = pts[line.to].y - line.y;

    let from = [pts[line.from].x0, pts[line.from].y0, pts[line.from].z];
    let to   = [pts[line.to].x0,   pts[line.to].y0,   pts[line.to].z];

    // TODO: Figure out how to handle edge cases.

    line.a = vector.unit(vector.cross(to, from));
    line.c = vector.unit(vector.sub(  to, from));
    line.b = vector.unit(vector.cross(line.a , line.c));
    line.d = vector.dot(from, line.b);
}

// This function resets face.borders to an array of line objects, and sets the
// current coordinate equations for those line objects. The motivation for this
// is to support edge-edge overlap checks between two faces.
function findEdgeEqns(face, pts) {
    face.borders = [];
    let n = face.length;
    for (let i = 0; i < n; i++) {
        let borderLine = {from: face[i], to: face[(i + 1) % n]};
        borderLine.type = 'line';
        findLineEqns(borderLine, pts);
        face.borders.push(borderLine);
    }
}


// ______________________________________________________________________
// Functions to help determine shape z-ordering.

// This will sort the values in `inputArr` according to the comparison data
// provided by calls to `inputCmp()`, which is expected to return the values '='
// (a string), '<', '>', or null; where a null indicates that the comparison
// value is undetermined, and that those two elements may go in any order.
// This function attempts to reduce the number of calls to inputCmp() in several
// ways:
//  * It memorizes given return values.
//  * It assumes that if a < b then also b > a (otherwise what is happening?).
//  * It builds a tree to infer transitive comparisons, and tries to maximize
//    the use of that tree.
// XXX 1. This function probably does not need to be exported.
//     2. Consider putting this in util.js instead of here.
export function sortWithPartialInfo(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    console.log('Start sortWithPartialInfo()');
    let numCmpCalls = 0;

    // 1. Set up memoization for inputCmp().

    // This serves to both memorize results as well as to allow us to treat the
    // input as an array of integers, although inputArr may have any types.
    const cache = {};
    function cmp(a, b) {
        let key = a + ':' + b;
        let val = cache[key];
        if (val !== undefined) return val;

        // let result = (a === b) ? '=' : inputCmp(inputArr[a], inputArr[b], ctx);
 
        // XXX DEBUG1 (replace with the above line)
        let result;
        if (a === b) {
            result = '=';
        } else {
            numCmpCalls++;
            result = inputCmp(inputArr[a], inputArr[b], ctx);
        }
    
        cache[key] = result;

        let otherKey = b + ':' + a;
        let otherResult = result;
        if (result === '<') otherResult = '>';
        if (result === '>') otherResult = '<';
        cache[otherKey] = otherResult;

        return result;
    }

    // 2. Sort `arr`, using the memoized comparison function cmp().

    let arr     = inputArr.map((e, i) => i);
    let sorted  = [];
    let min     = arr[arr.length - 1];
    let cmpTree = {[min]: []}

    let hl1 = '<span class="highlight">';
    let hl2 = '</span>';
    say('<p><hr>Beginning to sort<br>');
    say(`Candidate ${hl1}min = ${getShapeName(inputArr[min])}${hl2}`);

    let getName = x => getShapeName(inputArr[x]);
    function printCmpTree(min, cmpTree) {
        let y = min;
        let cols = [[getName(y)]];
        while (y !== undefined) {
            if (y in cmpTree) {
                cols.push(cmpTree[y].map(getName));
                y = cmpTree[y][0];
            } else {
                break;
            }
        }
        say('cmpTree:');
        showTableWithColumns(cols.slice(0, cols.length - 1), ' < ');
    }

    while (arr.length > 0) {

        let xIdx = arr.length;
        while (true) {

            xIdx--;
            if (xIdx === -1) {
                let n = getShapeName(inputArr[min]);
                say(`<span class="framed">Adding shape ${n}</span>`);
                sorted.push(min);
                arr.splice(arr.indexOf(min), 1);
                for (let i = 1; i < cmpTree[min].length; i++) {
                    delete cmpTree[cmpTree[min][i]];
                }
                min = cmpTree[min][0];
                // If the order is not fully determined, cmpTree could be empty
                // yet we may still have elements left in arr.
                if (min === undefined && arr.length > 0) {
                    min = arr[arr.length - 1];
                    cmpTree[min] = [];
                }
                if (min !== undefined) {
                    let n = getShapeName(inputArr[min]);  // XXX
                    say(`Candidate ${hl1}min = ${n}${hl2}`);
                    printCmpTree(min, cmpTree);
                }
                break;
            }

            let x = arr[xIdx];
            let n = getShapeName(inputArr[x]);  // XXX
            if (x in cmpTree) {
                let minName = getShapeName(inputArr[min]);
                say(`Keeping the min (${minName}) < ${n} as n is in the cmpTree`);
                continue;
            }
            indent();
            let c = cmp(x, min);
            dedent();
            if (c === '>') {
                say(`Keeping the min < ${n} as indicated by cmp`);
                cmpTree[min].push(x);
                cmpTree[x] = [];
            } 
            if (c === '<') {
                // say(`It looks like ${n} is smaller`);
                say(`New candidate ${hl1}min = ${n}${hl2}`);
                cmpTree[x] = [min];
                min  = x;
                xIdx = arr.length;
                printCmpTree(min, cmpTree);
            }
        }
    }

    // DEBUG1
    // Find the chains in `arr`.
    let chainLens = [];
    let thisChain = 1;
    sorted.forEach((elt, i) => {
        if (i === sorted.length - 1) return;
        if (cmp(elt, sorted[i + 1]) === '<') {
            thisChain++;
        } else {
            chainLens.push(thisChain);
            thisChain = 1;
        }
    });
    console.log('Chain lengths in sorted:');
    console.log(chainLens.join(', '));

    // DEBUG1
    console.log(`numCmpCalls = ${numCmpCalls}`);
    console.log('End sortWithPartialInfo()');

    return sorted.map(i => inputArr[i]);
}

function updateBoundsForFace(face, pts) {
    face.xMin = Math.min(...face.map(i => pts[i].x));
    face.xMax = Math.max(...face.map(i => pts[i].x));
    face.yMin = Math.min(...face.map(i => pts[i].y));
    face.yMax = Math.max(...face.map(i => pts[i].y));
}

function updateBoundsForLine(line, pts) {
    line.xMin = Math.min(...[line.from, line.to].map(i => pts[i].x));
    line.xMax = Math.max(...[line.from, line.to].map(i => pts[i].x));
    line.yMin = Math.min(...[line.from, line.to].map(i => pts[i].y));
    line.yMax = Math.max(...[line.from, line.to].map(i => pts[i].y));
}

function updateBoundsForShape(shape, pts) {
    console.assert(shape.type === 'face' || shape.type === 'line');
    if (shape.type === 'face') updateBoundsForFace(shape, pts);
    if (shape.type === 'line') updateBoundsForLine(shape, pts);
}

function compareLineAndFace(s1, s2, pts) {

    let line = s1;
    let face = s2;
    let doSwap = false;

    if (s1.type !== 'line') {
        [face, line] = [line, face];
        doSwap = true;
    }
    function ret(x) {
        console.assert(x === '<' || x === '>');
        if (doSwap) x = (x === '<') ? '>' : '<';
        let n1 = getShapeName(s1);
        let n2 = getShapeName(s2);
        say(`compareLineAndFace: ${n1} ${n2} is returning ${x}`);
        return x;
    }

    console.assert(face.type === 'face' && line.type === 'line');

    // The line is in front ">" of the face when the line is an edge of it.
    if (line.from in face.ptSet && line.to in face.ptSet) return ret('>');

    // Check if either line endpoint both (a) is not shared with the face and
    // (b) overlaps the face in the view plane.
    for (let ptIdx of [line.from, line.to]) {
        if (ptIdx in face.ptSet) continue;
        let c = comparePointAndFace(ptIdx, face, pts);
        if (c !== null) return ret(c);
    }

    // Check if the line overlaps any border line of the face.
    for (let border of face.borders) {
        let c = compareShapes(
            line, border, pts, {doSharedVertexCheck: false}
        );
        if (c) return ret(c);
    }

    // If we get here, the line doesn't overlap the face.
    return null;
}

// This accepts a single point and a face/polygon. This function compares them,
// and returns '<' when the point is behind the face; '>' when the point is in
// front of the face; and null when the point and face do not overlap in the
// view plane.
function comparePointAndFace(ptI, face, pts) {

    function ret(v, reason) {
        if (reason === undefined) reason = '';
        let n1 = `point ${ptI}`;
        let n2 = getShapeName(face);
        say(`comparePointAndFace: ${n1} ${n2} is returning ${v}` + reason);
        return v;
    }

    if (ptI in face.ptSet) return ret(null);

    let q = pts[ptI];

    // Check if a ray from pt -> (infty, 0) crosses each edge.
    let numCross = 0;
    for (let j0 = 0; j0 < face.length; j0++) {
        let j1 = (j0 + 1) % face.length;
        let k0 = face[j0], k1 = face[j1];
        let p0 = pts[k0],  p1 = pts[k1];

        // First check if the edge crosses the line y=q.y.
        if ( (p1.y > q.y && p0.y <= q.y) ||
             (p0.y > q.y && p1.y <= q.y) ) {

            // TODO: Handle the case that p0.y == p1.y.
            let x = ( (p1.x - q.x) * (p0.y - q.y) -
                      (p0.x - q.x) * (p1.y - q.y) ) /
                    (p0.y - p1.y);

            if (x > 0) numCross++;
        }
    }

    if (numCross % 2 === 1) {
        let reason = `: Point ${ptI} is an overlap`;
        let ptZ = q.z;
        reason += ` with z=${ptZ.toFixed(2)}`;

        // The other face has eqn <a, face.n> = face.c.
        // a = t * q. t = face.c / <q, face.n>.
        let t = face.c / vector.dot(q, face.n);
        let faceZ = q[2] * t;
        reason += ` other face has z=${faceZ.toFixed(2)}`;

        // Returning '>' means "draw the pt last" (draw point after face).
        return ret((ptZ < faceZ) ? '>' : '<', reason);
    }

    return ret(null);
}

function compareFaces(s1, s2, pts) {

    console.assert(s1.type === 'face');
    console.assert(s2.type === 'face');

    // 1. Check to see if any point is in the boundaries of the other face.

    let shapes = [s1, s2];
    for (let i = 0; i < 2; i++) {
        let ptShape = shapes[i];
        let poly    = shapes[1 - i];

        for (let ptIdx of ptShape) {
            let c = comparePointAndFace(ptIdx, poly, pts);
            if (c !== null) {
                if (i === 0) return c;
                if (i === 1) return (c === '>') ? '<' : '>';
            }
        }
    }

    // 2. Check if there are any edge-edge overlaps.

    for (let border1 of s1.borders) {
        for (let border2 of s2.borders) {
            let c = compareShapes(
                border1, border2, pts, {doSharedVertexCheck: false}
            );
            if (c) return c;
        }
    }

    return null;
}

function compareLines(s1, s2, pts, options) {

    // 1. If the lines share one vertex, order based on the z value of the
    //    non-shared vertex.

    function ret(x, reason) {
        if (reason === undefined) reason = '';
        let n1 = getShapeName(s1);
        let n2 = getShapeName(s2);
        say(`compareLines: ${n1} ${n2} is returning ${x}` + reason);
        return x;
    }

    // Right now the shared-vertex check is optional, and turned off for
    // border-border checks when seeing if one face overlaps another.
    if (options === undefined || options.doSharedVertexCheck) {

        // This compares line 1 from sh ("shared") to i1 against line 2 from sh
        // to i2. If the ray from the eye (origin) to sh is more aligned with
        // either, then that closer line is > than the other.
        // TODO: Define this at an outer scope so that it need not be redefined
        // inside this (compareLines()) fn.
        function c(sh, i1, i2) {
            let v1 = -vector.dot(pts[sh], vector.sub(pts[i1], pts[sh]));
            let v2 = -vector.dot(pts[sh], vector.sub(pts[i2], pts[sh]));
            return ret((v1 > v2) ? '>' : '<', ': single shared vertex');
        }

        // TODO: Just delete the string 'ret' from each line; keep parens.
        if (s1.from === s2.from) return c(s1.from, s1.to, s2.to);
        if (s1.from === s2.to  ) return c(s1.from, s1.to, s2.from);
        if (s1.to   === s2.from) return c(s1.to, s1.from, s2.to);
        if (s1.to   === s2.to  ) return c(s1.to, s1.from, s2.from);
    }

    // 2. Determine if there is a point overlap in the view plane.

    // We'll treat each line as the set of points
    // { (x, y) + t * (dx, dy), t in [0, 1] }
    // and we'll solve for t1, t2, one t parameter per line.
    //
    // Here is the linear equation system we're solving for t1 and t2:
    // ( dx1 -dx2 )( t1 ) = ( x2 - x1 )
    // ( dy1 -dy2 )( t2 ) = ( y2 - y1 )
    let soln = solveLinEqn(
        s1.dx, -s2.dx, s1.dy, -s2.dy,
        s2.x - s1.x, s2.y - s1.y
    );
    if (soln === null) {
        // There is no solution.
        return ret(null, ': no soln at all to lin eqn');
    }
    let t1 = soln[0], t2 = soln[1];
    if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) {
        return ret(null, ': no overlap due to t val(s) out of [0, 1]');
    }

    let reason = ': line-line overlap:';

    let viewPlaneRay = [s1.x + t1 * s1.dx, s1.y + t1 * s1.dy, ctx.zoom];
    let line1Ray = vector.scale(
        viewPlaneRay,
        s1.d / vector.dot(viewPlaneRay, s1.b)
    );
    let line2Ray = vector.scale(
        viewPlaneRay,
        s2.d / vector.dot(viewPlaneRay, s2.b)
    );

    reason += ` line1Ray.z=${line1Ray[2].toFixed(3)}`;
    reason += ` line2Ray.z=${line2Ray[2].toFixed(3)}`;

    // TODO: Think about what a good value for the tolerance is here.
    let delta = line2Ray[2] - line1Ray[2];
    if (Math.abs(delta) < 0.00001) return ret(null, ': overlap pt is the same');

    return (line1Ray[2] < line2Ray[2]) ? ret('>', reason) : ret('<', reason);
}


// This compares the shapes s1 and s2; it returns:
//   '<'  if s1 is behind s2,
//   '>'  if s1 is in front of s2, and
//   null if the shapes do not overlap.
// It's expected that s1 and s2 are both either lines or faces.
// The `options` object may contain {doSharedVertexCheck: false}; the default
// value for this option is `true`. This option only applies to line-line
// comparisons, in which case lines may be optionally considered to overlap even
// when they only share an endpoint (this makes sense when the lines are
// rendered as wide, and are not of the same color).
function compareShapes(s1, s2, pts, options) {

    let myCall = getShapeName(s1) + ' ' + getShapeName(s2);
    myCall     = 'compareShapes: ' + myCall;
    say(myCall + ' called');

    function ret(v, reason) {
        dedent();
        if (reason === undefined) reason = '';
        say(myCall + ' is returning ' + v + ' ' + reason);
        return v;
    }

    // Return null quickly if the bounding boxes don't overlap.

    updateBoundsForShape(s1, pts);
    updateBoundsForShape(s2, pts);

    if (s1.xMax < s2.xMin ||
        s1.xMin > s2.xMax ||
        s1.yMax < s2.yMin ||
        s1.yMin > s2.yMax) {
        indent();
        return ret(null, 'no bbox overlap');
    }

    if (s1.type === 'face' && s2.type === 'face') {
        say(myCall + ' delegating to compareFaces()');
        indent();
        return ret(compareFaces(s1, s2, pts));
    } else if (s1.type === 'line' && s2.type === 'line') {
        let optsStr = '';
        if (options && options.doSharedVertexCheck === false) {
            optsStr = 'noSharedVertexCheck';
        }
        say(myCall + ` delegating to compareLines(${optsStr})`);
        indent();
        return ret(compareLines(s1, s2, pts, options));
    } else {
        say(myCall + ' delegating to compareLineAndFace()');
        indent();
        return ret(compareLineAndFace(s1, s2, pts));
    }

    indent();
    return ret(null, 'fall-through case');
}

// TODO:
//     The plan is for this function to eventually replace orderElts() and to
//     delete the old function (whose code is saved for posterity in git).
function orderElts2(pts, normalXYs) {

    startComments();

    say('<tt><p><hr>Point z values:');
    for (let [i, xy] of pts.entries()) say(`${i}: ${xy.z.toFixed(3)}`);

    // Remove all SVG elements so we can re-insert in a new order.
    for (let dot     of ctx.dots)         dot.remove();
    for (let outline of ctx.outlines)     outline.remove();
    for (let line    of ctx.lines)        line.elt.remove();
    for (let polygon of ctx.facePolygons) polygon.remove();

    // Find equations for all the face planes.
    for (let [i, face] of ctx.faces.entries()) {
        findFacePlane(face, pts, normalXYs[i]);
        findEdgeEqns(face, pts);
    }
    for (let line of ctx.lines) {
        findLineEqns(line, pts);
    }

    // Make points depend on their incident lines.
    for (let [i, pt] of pts.entries()) Object.assign(pt, {idx: i, deps: []});
    for (const [lineIdx, line] of ctx.lines.entries()) {
        // line.elt.setAttribute('stroke-width', 10);  // XXX
        Object.assign(line, {idx: lineIdx, pts});
        for (let i of [line.from, line.to]) pts[i].deps.push(lineIdx);
    }

    // Make lines depend on their incident faces.
    for (let line of ctx.lines) line.deps = [...line.faces];

    let shapes = ctx.prevBackToFront ?? [...ctx.faces, ...ctx.lines];
    // let shapes = [...ctx.faces, ...ctx.lines];
    let backToFront = sort.sort(shapes, compareShapes, pts)['sorted'];
    // let backToFront = sortWithPartialInfo(shapes, compareShapes, pts);
    ctx.prevBackToFront = backToFront;

    say('<p><hr>Here is the ordering of shapes I got, back-to-front:');
    for (let s of backToFront) say(getShapeName(s));

    say('<p><hr>Now I\'ll render:');
    for (let shape of backToFront) {
        if (shape.type === 'face') {
            mainGroup.appendChild(shape.polygon);
            say('Rendering: ' + getShapeName(shape));
        }
        if (shape.type === 'line') {
            if (shape.elt.parentElement) continue;
            mainGroup.appendChild(shape.elt);
            say('Rendering: ' + getShapeName(shape));
            for (let i of [shape.from, shape.to]) pts[i].lineDrawn(shape.idx);
        }
    }

    showComments();
}

function orderElts(xys) {

    // 1. Remove all SVG elements so we can re-insert in a new order.
    for (let dot     of ctx.dots)         dot.remove();
    for (let outline of ctx.outlines)     outline.remove();
    for (let line    of ctx.lines)        line.elt.remove();
    for (let polygon of ctx.facePolygons) polygon.remove();

    // 2. Prepare a list of z-ordered points linked with adjacent edges.
    let pts = [];
    for (let i = 0; i < xys.length; i++) {
        pts.push({
            z: xys[i].z,
            elt: ctx.dots[i],
            outline: ctx.outlines[i],
            deps: [],
            isForeground: xys[i].isForeground
        });
    }
    for (let line of ctx.lines) {
        pts[line.from].deps.push(line.elt);
        pts[line.to].deps.push(line.elt);
    }
    // Sort from high z to low z.
    // We do it this way because we want the highest-z element to be farthest
    // back, aka first, in the child list of the mainGroup svg parent.
    // First children are rendered to appear behind later children.
    pts.sort((item1, item2) => item2.z - item1.z);

    // 3. Draw background points and their adjacent edges.
    for (let pt of pts) {
        if (pt.isForeground) continue;
        // Add any dependencies, eg lines adjacent to a dot.
        for (let dep of pt.deps) {
            if (!dep.parentElement) mainGroup.appendChild(dep);
        }
        if (pt.outline) mainGroup.appendChild(pt.outline);
        if (pt.elt) mainGroup.appendChild(pt.elt);
    }

    // 4. Draw any remaining interior lines.
    for (let line of ctx.lines) {
        if (line.elt.parentElement) continue;  // Skip already-drawn lines.
        // Case A: Internal lines not yet rendered.
        if (line.type === 'internal') {
            mainGroup.appendChild(line.elt);
        }
        // Case B: Background face lines not yet rendered.
        if (line.type === 'face' && !line.isForeground) {
            mainGroup.appendChild(line.elt);
        }
    }

    // 5. Draw all visible faces.
    for (let polygon of ctx.facePolygons) mainGroup.appendChild(polygon);

    // 6. Draw all remaining points and edges.
    for (let line of ctx.lines) {
        if (line.elt.parentElement) continue;  // Skip already-drawn lines.
        // Lines marked as "internal" or "face" by the caller have special
        // treatment above. The purpose of these next lines is to support border
        // lines drawn after all faces.
        if (line.type === undefined) {
            mainGroup.appendChild(line.elt);
        }
    }
    for (let pt of pts) {
        if (!pt.elt || pt.elt.parentElement) continue;
        // Add any dependencies, eg lines adjacent to a dot.
        for (let dep of pt.deps) {
            if (!dep.parentElement) mainGroup.appendChild(dep);
        }
        if (pt.outline) mainGroup.appendChild(pt.outline);
        mainGroup.appendChild(pt.elt);
    }
}


// ______________________________________________________________________
// Debug messaging.

let commentElt  = document.getElementById('comment');
commentElt = null;  // XXX
let prefix = '';
let commentParts = [];

function startComments() {
    commentParts = [];
}

function showComments() {
    if (!commentElt) return;
    commentElt.innerHTML = commentParts.join('\n');
}

function indent() {
    prefix = prefix + '&nbsp;'.repeat(4);
}

function dedent() {
    prefix = prefix.substr(4 * 6);  // 4 * len('&nbsp;')
}

function say(s) {
    // return;  // XXX
    // commentElt.innerHTML += (prefix + s + '<br/>\n');

    let spanStart = '';
    let spanEnd   = '';
    if (prefix) [spanStart, spanEnd] = ['<span class="gray">', '</span>'];
    commentParts.push(prefix + spanStart + s + spanEnd + '<br/>\n');
}

function showTableWithColumns(cols, topSep) {

    let numRows = Math.max(...cols.map(x => x.length));
    cols.forEach(col => {
        while (col.length < numRows) col.push('');
    });

    // Find the maximum width in each column.
    let widths = cols.map(col => Math.max(...col.map(x => x.length)));
    // say('widths: ' + widths.join(', ')); // XXX

    let nonTopSep = ''.padStart(topSep.length);
    // say(`nonTopSet="${nonTopSep}"`);  // XXX
    for (let i = 0; i < numRows; i++) {
        let sep = (i === 0) ? topSep : nonTopSep;
        let msg = cols.map((col, j) => col[i].padStart(widths[j])).join(sep);
        say(msg.replaceAll(' ', '&nbsp;'));
    }
}

function getShapeName(s) {
    if (s.type === 'face') {
        return 'f:' + s.join(',');
        // return `face(${s[0]}, ${s[1]}, ${s[2]}, ${s[3]})`;
    }
    if (s.type === 'line') {
        return `${s.from}--${s.to}`;
    }
}

function isTiny(x) { return Math.abs(x) < 0.00001; }

// This solves the 2x2 system of equations for x and y:
// ( a b )( x ) = ( e )
// ( c d )( y ) = ( f )
// This handles all edge cases correctly, such as the matrix being singular but
// the problem still being solveable. This returns null if there is no solution;
// otherwise an array [x, y].
// TODO: Move this into util.
function solveLinEqn(a, b, c, d, e, f) {
    if (isTiny(a) && isTiny(b)) {
        // Swap the rows.
        [a, b, c, d, e, f] = [c, d, a, b, f, e];
    }
    let col_swap_needed = isTiny(a);
    if (col_swap_needed) [a, b, c, d] = [b, a, d, c];

    // Now a is nonzero and we can easily use a row-echelon approach.
    let numer = a * f - c * e;
    let denom = a * d - b * c;
    if (isTiny(denom) && !isTiny(numer)) return null;  // There's no solution.
    let y = (isTiny(denom) ? 0 : numer / denom);
    if (isTiny(a) && !isTiny(e - b * y)) return null;  // There's no solution.
    let x = (isTiny(e - b * y) ? 0 : (e - b * y) / a);

    return (col_swap_needed ? [y, x] : [x, y]);
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
    edgeGroup    = artist.add('g');
    outlineGroup = artist.add('g');
    dotGroup     = artist.add('g');
    mainGroup    = artist.add('g');
}

function addAnyNewDots() {
    ensureGroupsExist();
    if (!ctx.doDrawDots) return;
    for (let i = ctx.dots.length; i < ctx.pts[0].length; i++) {
        let pt = calculateDrawPt(matrix.getColumn(ctx.pts, i));
        let elt        = artist.addCircle(pt, dotStyle, dotGroup);
        let outlineElt = artist.addCircle(pt, outlineStyle, outlineGroup);
        elt.baseColor  = util.getStdColor(dotStyle.fill);
        ctx.dots.push(elt);
        ctx.outlines.push(outlineElt);
        if (!pt.isVisible) {
            elt.hidden = true;
            outlineElt.hidden = true;
        }
    }
}

function addAnyNewNormals(objCenter) {
    for (let i = ctx.normals[0].length; i < ctx.faces.length; i++) {

        let face = ctx.faces[i];
        let P = matrix.transpose(ctx.pts);

        console.assert(face.length > 2, 'Faces need at least 3 points.');

        // Link the face to lines on it (face lines, not edge lines).
        face.lines = [];
        for (let line of ctx.lines) {
            if (line.type !== 'face') continue;
            if (face.includes(line.from) && face.includes(line.to)) {
                face.lines.push(line);
            }
        }

        // Find the center of the face (for debugging).
        let center = Array(4).fill(0);
        for (let j = 0; j < face.length; j++) {
            center = center.map((x, i) => x + P[face[j]][i]);
        }
        center = center.map(x => x / face.length);
        ctx.faceCenters.push(center);

        // Find the normal direction.
        let a = vector.sub(P[face[1]], P[face[0]]);  // a = p1 - p0.
        let b = vector.sub(P[face[2]], P[face[0]]);  // b = p2 - p0.
        let n = vector.unit(vector.cross(a, b));     // n = unit(a x b).

        // Choose the sign of n so that it points away from the origin.
        // This assumes the overall shape is convex, and that the origin is on
        // the interior of the shape.
        let sign = Math.sign(vector.dot(n, vector.sub(center, objCenter)));
        n = n.map(x => x * sign);

        n.push(0);  // Make n a length-4 vector.
        for (let j = 0; j < 4; j++) ctx.normals[j].push(n[j]);

        // Add data to visually render normal lines.
        // Normal line rendering depends on ctx.doDrawNormalLines.
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
        for (let j = 0; j < face.length; j++) {
            faceP.push(vector.sub(P[face[j]], center));
        }
        faceP = matrix.transpose(faceP).slice(0, 3);
        let T = matrix.mult(Q, faceP);
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
        angles.sort((a, b) => b.angle - a.angle);
        for (let j = 0; j < angles.length; j++) face[j] = angles[j].index;
        let style = Object.assign({}, facePolyStyle, face.style);
        face.baseColor = style.fill;
        ctx.facePolygons.push(artist.addPolygon([], style));

        // TODO Move mouse event setup to its own function.
        let polygon = ctx.facePolygons[ctx.facePolygons.length - 1];
        face.polygon = polygon;
        polygon.setAttribute('stroke-width', '4');
        polygon.addEventListener('mouseover', e => {
            logEvent(e);
            highlightedFaceElt = polygon;
            lastHighlightedFaceIndex = i;
            if (ctx.mode !== 'dragging') {
                toggleFaceLabels(i, true);  // true -> doShow
            }
        });
        polygon.addEventListener('mouseout', e => {
            logEvent(e);
            polygon.setAttribute('stroke', 'transparent');
            if (highlightedFaceElt) {
                // false -> doShow
                toggleFaceLabels(highlightedFaceIndex, false);
                highlightedFaceElt = null;
            }
        });
    }
}

function setupFrame(ts) {
    window.requestAnimationFrame(setupFrame);

    if (lastTs === null) {
        lastTs = ts;
        return;
    }

    let timeDeltaSeconds = (ts - lastTs) / 1000;
    lastTs = ts;

    if (ctx.mode === 'spinning') {
        let angle = ctx.rotationsPerSec * 2 * Math.PI * timeDeltaSeconds;
        let t = matrix.rotateAroundX(ctx.rotationSign * angle);
        t = matrix.mult(ctx.angleMatInv, t, ctx.angleMat);
        ctx.rotateMat = matrix.mult(t, ctx.rotateMat);
    }
    setTransform(matrix.mult(ctx.transMat, ctx.rotateMat));
    artist.render();
}

function moveElt(elt, dx, dy) {
    elt.setAttribute('x', parseInt(elt.getAttribute('x')) + dx);
    elt.setAttribute('y', parseInt(elt.getAttribute('y')) + dy);
}

// XXX TODO Move this to the appropriate section of this file.
export function addLabels(labels, offset) {
    for (let [i, label] of labels.entries()) {
        addLabel(ctx.dots[i], label, offset);
    }
}

function addLabel(dot, label, offset) {

    if (offset === undefined) offset = 0;

    dot.label = artist.add('g');
    let r = artist.addRect({x: 0, y: 0}, whiteStyle, dot.label);
    let t = artist.addText({x: 0, y: 0}, label, textStyle, dot.label);
    t.setAttribute('pointer-events', 'none');
    if (t.style) t.style.userSelect = 'none';

    // Adjust the background rectangle.
    let padding = 5;
    r.setAttribute('rx', padding);
    let box = t.getBBox();
    let wText = box.width;
    let hText = box.height - 6;
    r.setAttribute('width',  wText + 2 * padding);
    r.setAttribute('height', hText + 2 * padding);
    // Place the rect's anchor point at the bottom-left of the text box.
    moveElt(r, -padding, -(hText + padding));

    // Adjust the anchor point to be in the middle of the text box.
    moveElt(r, -wText / 2 + offset, hText / 2 - offset);
    moveElt(t, -wText / 2 + offset, hText / 2 - offset);
}

function toggleFaceLabels(faceIdx, doShow, awayFrom) {

    if (faceIdx === -1) return;
    if (!ctx.labels) return;

    // They're allowed to toggle labels on more than once, we just do nothing if
    // the labels are already on.
    if (doShow) {
        if (highlightedFaceElt && highlightedFaceIndex === faceIdx) return;
    }

    for (let i of ctx.faces[faceIdx]) {
        let dot = ctx.dots[i];
        dot.showLabel = true;
        dot.awayFrom  = awayFrom;
        if (doShow) {
            let label = ctx.labels[i];
            addLabel(dot, label);
        } else if (dot.label) {
            dot.label.remove();
            delete dot.label;
        }
    }
    highlightedFaceIndex = doShow ? faceIdx : -1;
    if (doShow) lastHighlightedFaceIndex = faceIdx;
}


// ______________________________________________________________________
// Public functions.

// This expects `obj` to be an array in the format [pts, lines, faces].
// This is similar to calling addPoints(), addLines(), and addFaces(), except
// that the point indexes used in `obj` are assumed to be internal (referring to
// its own points array), and are translated to the global points array by this
// function.
export function addObject(obj) {
    console.assert(obj.length === 3);
    let n = ctx.pts[0].length;
    addPoints(obj[0]);
    addLines(obj[1].map(
        line => Object.assign(line, {from: line.from + n, to: line.to + n})
    ));
    addFaces(obj[2].map(
        face => Object.assign(face, face.map(idx => idx + n))
    ));
}

// This expects `pts` to be an array of 3d points, with each point being an
// array of 3 numbers.
export function addPoints(pts, labels) {
    console.assert(artist !== null);
    for (let pt of pts) {
        appendPoint(pt);
    }
    addAnyNewDots();
    if (labels) ctx.labels = labels;
}

// XXX This is not really public, so put it somewhere else in this file.
function faceDrawn(faceIdx) {
    this.deps.splice(this.deps.indexOf(faceIdx), 1);
    if (this.deps.length === 0) {
        mainGroup.appendChild(this.elt);
        say('[faceDrawn] Rendering: ' + getShapeName(this));
        this.pts[this.from].lineDrawn(this.idx);
        this.pts[this.to].lineDrawn(this.idx);
    }
}

// This expects `lines` to be an array of {from, to} objects, where `from` and
// `to` are indexes into the `pts` array. Each line object may also have an
// optional `style` key, which indicates the style overrides for that line.
export function addLines(lines, slices) {
    ensureGroupsExist();
    for (let line of lines) {
        let fromPt = getXYArray(matrix.getColumn(ctx.pts, line.from))[0];
        let toPt   = getXYArray(matrix.getColumn(ctx.pts, line.to))[0];
        let style  = Object.assign({}, lineStyle, line.style);
        line.elt   = artist.addLine(fromPt, toPt, style, edgeGroup);
        line.elt.setAttribute('pointer-events', 'none');
        line.baseColor = util.getStdColor(style.stroke);
        line.coreColor = line.baseColor;  // Save to undo edge highlights.
        line.coreWidth = style['stroke-width'];
        line.faceDrawn = faceDrawn;
        line.type      = 'line';
        line.idx       = ctx.lines.length;
        ctx.lines.push(line);
    }
    ctx.slices = slices;  // If no edges are highlighted, undefined is ok.
    ensureFaceEdgesAreIndexed();
}

// This expects each face to be an array of indexes into `pts`.
// Each face is expected to live in a plane, and it's expected that the points
// are convex and listed counterclockwise.
export function addFaces(faces) {
    // Make a local internal copy of the array that we will modify.
    // This enables the caller to do other things with their `faces` array after
    // this call.
    faces = structuredClone(faces);

    ctx.faces.push(...faces);

    // Augment the face data.
    let allPts = {};
    faces.forEach((face, i) => {
        face.idx   = i;
        face.type  = 'face';
        face.ptSet = {};
        face.forEach((pt) => { face.ptSet[pt] = true; allPts[pt] = true });
    });
    // Find a point inside the object. I call it objCenter, but it doesn't have
    // to be the middle, just in the interior to get the normals right.
    let objCenter = [0, 0, 0];
    let P = matrix.transpose(ctx.pts);
    for (let i in allPts) {
        objCenter = vector.add(objCenter, P[i]);
    }
    objCenter = vector.scale(objCenter, 1 / Object.keys(allPts).length);
    addAnyNewNormals(objCenter);
    // XXX TODO: Also call this from addLines().
    ensureFaceEdgesAreIndexed();
}

// XXX TODO Comment and move this function.
// This ensures that each line has line.faces = [faceIdx*] for any faces which
// have the given line as an edge; and that, similarly, each face has
// face.edges = [lineIdx*] for each line that is part of its border.
function ensureFaceEdgesAreIndexed() {
    // This will recompute all connections every time it's called.
    // I'm doing this for now because, in order to implement an incremental
    // version, I would need to track in pass in what is new, which may be just
    // lines, or just faces. It is possible, but a little more code, and I
    // suspect this is not going to be a critical path.
    for (let face of ctx.faces) face.edges = [];
    for (let [lineIdx, line] of ctx.lines.entries()) {
        line.faces = [];
        for (let [faceIdx, face] of ctx.faces.entries()) {
            let n = face.length;
            for (let i = 0; i < n; i++) {
                if (
                    (face[i] === line.from && face[(i + 1) % n] == line.to) ||
                    (face[i] === line.to   && face[(i + 1) % n] == line.from)
                ) {

                    console.log('\n');
                    console.log('Found a connection.');
                    console.log('Line:', line.from, line.to);
                    console.log('Face:', face.join(', '));

                    face.edges.push(lineIdx);
                    line.faces.push(faceIdx);
                }
            }
        }
    }
}

export function setCircle(center, r, normal, style) {

    if (style === undefined) style = thickLineStyle;

    let c = {};

    c.normal = vector.unit(normal);
    c.normal.push(0);  // Make it a 4d vector for easier transformation.

    c.center = center.slice();
    c.center.push(1);  // Make it a 4d vector.

    c.radius = r;
    c.paths = [];

    c.style = style;

    if (ctx.circle) {
        for (let path of ctx.circle.paths) path.remove();
    }
    ctx.circle = c;
}

export function setTransform(t) {
    ctx.transform = t;
    updatePoints();
}

export function makeDraggable() {
    console.assert(artist !== null);
    artist.elt.addEventListener('mousedown', e => {
        logEvent(e);

        mousedownTs = e.timeStamp;
        xDrag = 0;
        yDrag = 0;

        ctx.mousePt = [e.offsetX, e.offsetY];
        preClickMode = ctx.mode;
        ctx.mode = 'dragging';
        if (highlightedFaceElt) {
            toggleFaceLabels(highlightedFaceIndex, false);
        }
    });
    artist.elt.addEventListener('mouseup', e => {
        logEvent(e);
        if (highlightedFaceElt) {
            toggleFaceLabels(lastHighlightedFaceIndex, true);
        }

        // If this was a long click, we don't treat it as a click.
        // However, if a long click had zero movement, we still count it.
        if (e.timeStamp - mousedownTs > 500 || didDrag()) {
            ctx.mode = 'paused';
            return;
        }

        let fromTo = {
            spinning: 'paused',
            dragging: 'paused',
            paused:   'spinning'
        };
        ctx.mode = fromTo[preClickMode];
    });
    artist.elt.addEventListener('mousemove', e => {
        logEvent(e);
        if ((e.buttons & 1) === 0) {
            if (ctx.mode === 'dragging') ctx.mode = 'paused';
            return;
        }
        ctx.mode = 'dragging';
        let delta = vector.sub([e.offsetX, e.offsetY], ctx.mousePt);
        ctx.mousePt = [e.offsetX, e.offsetY];
        xDrag += Math.abs(delta[0]);
        yDrag += Math.abs(delta[1]);

        let scale = artist.toCanvasScale;
        let t = matrix.rotateAroundY(delta[0] / scale);
        t = matrix.mult(matrix.rotateAroundX(delta[1] / scale), t);
        ctx.rotateMat = matrix.mult(t, ctx.rotateMat);
    });
}

// TODO Eventually support auto-setting ctx.fadeRange from this.
//      To do so, we can calculate the min and max distance from the origin to
//      any of the points.
export function setZDist(zDist) {
    ctx.transMat = matrix.eye(4);
    ctx.transMat[2][3] = zDist;
}

export function setAngleMat(angleMat) {
    ctx.angleMat    = angleMat;
    ctx.angleMatInv = matrix.transpose(angleMat);
}

export function rotateAround(v) {
    let M = matrix.rand(3, 3);
    M[0] = vector.unit(v);
    let [Q, R] = matrix.qr(matrix.transpose(M));
    let U = matrix.eye(4);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            U[i][j] = Q[i][j];
        }
    }
    ctx.angleMat    = matrix.transpose(U);
    ctx.angleMatInv = U;
}

export function highlightEdges(sliceName) {
    let slice = ctx.slices[sliceName] || {};
    for (let i = 0; i < ctx.lines.length; i++) {
        let line = ctx.lines[i];
        if (i in slice) {
            line.baseColor = ctx.edgeHighlightColors[slice[i]];
        } else {
            line.baseColor = line.coreColor;
        }
        let w = line.coreWidth;
        if (sliceName !== 'none') {
            w *= (i in slice) ? 5 : 0.5;
            if (i in slice) w = Math.max(w, 2);
        }
        line.elt.setAttribute('stroke-width', w);
    }
}

export function animate() {
    window.requestAnimationFrame(setupFrame);
}

let numTimesLeft = 600;  // DEBUG1

export function updatePoints() {

    // DEBUG2
    sort.dbgCtx.logLevel = 0;
    if (numTimesLeft < 5) {
        sort.dbgCtx.debugMode = false;
        sort.dbgCtx.getName = getShapeName;
    }

    // DEBUG1
    if (true && numTimesLeft <= 0) return;
    numTimesLeft--;

    console.assert(artist !== null);

    let xys = getXYArray(ctx.pts);
    // We may use the lineXYs early to help place labels around dots.
    let lineXYs = getXYArray(ctx.normalLinePts, false);

    if (ctx.doDrawDots) {
        for (let i = 0; i < xys.length; i++) {
            let dot = ctx.dots[i];
            let r = ctx.dotSize / xys[i].z;
            let outlineR = 2 * r;
            artist.moveCircle(dot, xys[i], r);
            dot.coreRadius = r * artist.toCanvasScale;
            if (dot.label) updateLabelForDot(dot, xys[i]);
            artist.moveCircle(ctx.outlines[i], xys[i], outlineR);
            if (ctx.fadeRange) {
                let color = getFadeColor(dot.baseColor, xys[i].z, dot);
                dot.setAttribute('fill', color);
            }
            dot.hidden = !xys[i].isVisible;
            ctx.outlines[i].hidden = !xys[i].isVisible;
        }
    }

    for (let line of ctx.lines) {
        let [from, to] = [xys[line.from], xys[line.to]];
        if (ctx.fadeRange) {
            let avgZ  = (xys[line.from].z + xys[line.to].z) / 2;
            let color = getFadeColor(line.baseColor, avgZ);
            line.elt.setAttribute('stroke', color);
        }
        artist.moveLine(line.elt, from, to);
    }

    // At the same time that face polygons are updated, we also (a) determine
    // which ones are visible, and (b) determine which points are in the
    // background, meaning that all adjacent faces are pointing away.

    // Mark all points as background; we'll move some to foreground below.
    for (let xy of xys) xy.isForeground = false;

    let normalXYs = getXYArray(ctx.normals, false);  // doPerspective = false
    for (let i = 0; i < ctx.faces.length; i++) {
        let face = ctx.faces[i];
        let faceXYs = [];
        for (let j = 0; j < face.length; j++) faceXYs.push(xys[face[j]]);
        artist.movePolygon(ctx.facePolygons[i], faceXYs);
        let isHidden = vector.dot(
            [normalXYs[i].x, normalXYs[i].y, normalXYs[i].z],
            [lineXYs[2 * i].x, lineXYs[2 * i].y, lineXYs[2 * i].z]
        ) > 0;
        if (ctx.doDrawBackFaces) isHidden = false;
        for (let line of face.lines) line.isForeground = !isHidden;
        let polygon = ctx.facePolygons[i];
        polygon.setAttribute('display', isHidden ? 'none' : 'hi');

        // Adjust alpha and color a bit for a little more 3d effect.
        let towardLight = vector.dot(
            [normalXYs[i].x, normalXYs[i].y, normalXYs[i].z],
            lightDir
        );
        let ell = Math.floor(towardLight * 40) + 215;
        let alpha = (towardLight ** 2) * 0.3 + 0.4;  // Between 0.4 and 0.7.
        if (!ctx.doDrawFaces) alpha = 0;
        // TODO
        // Factor this out to a function. If there is a base color, use that
        // somehow. If not, use what I already have as a default.
        // I need to first save an incoming fill color to a special location so
        // I can treat fill as a per-frame variable that loads from a saved base
        // color. See if I can re-use how I do this in another place (if I do)
        // for code consistency.
        // polygon.setAttribute('fill', `rgba(${ell}, ${ell}, ${ell}, ${alpha})`);
        polygon.setAttribute('fill', getShadedFaceColor(face.baseColor, towardLight));

        if (!isHidden) {
            for (let j of face) xys[j].isForeground = true;
        }
    }
    
    // XXX
    orderElts2(xys, normalXYs);

    // XXX
    // orderElts(xys);

    if (ctx.doDrawNormalLines) drawNormalLines();

    // XXX I will need to integrate this with the z order of things.
    renderCircle();
}

export function setArtist(newArtist) {
    artist = newArtist;
}

export function render() {
    setTransform(matrix.mult(ctx.transMat, ctx.rotateMat));
    artist.render();
}

export function reset() {
    lastTs = null;
    mousedownTs = null;
    preClickMode = 'spinning';
    ctx.mode = 'spinning';

    ctx.rotateMat   = matrix.eye(4);
    ctx.transMat    = matrix.eye(4);
    ctx.angleMat    = matrix.eye(4);
    ctx.angleMatInv = matrix.eye(4);
    ctx.rotationsPerSec = 1;
    ctx.rotationSign = 1;

    ctx.pts = [[], [], [], []];
    ctx.dots = [];
    ctx.outlines = [];
    ctx.dotSize = 0.06;

    ctx.lines = [];

    ctx.doDrawFaces = true;
    ctx.faces = [];
    ctx.normals = [[], [], [], []];
    ctx.faceCenters = [];
    ctx.facePolygons = [];

    ctx.doDrawNormalLines = false;
    ctx.normalLinePts = [[], [], [], []];
    ctx.normalLines = [];

    ctx.circle = null;

    ctx.transform = matrix.eye(4);

    ctx.zoom = 1;

    ctx.fadeRange = null;

    ctx.slices = {};

    lightDir = vector.unit([-1, -1, -2]);

    highlightedFaceElt = null;
    highlightedFaceIndex = -1;
    lastHighlightedFaceIndex = -1;

    artist = null;

    eyeZ = 0.001;

    // Groups.
    mainGroup    = null;
    dotGroup     = null;
    outlineGroup = null;
    edgeGroup    = null;
}

