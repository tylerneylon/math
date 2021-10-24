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

let lastTs = null;  // This is the last-seen timestamp; it's used to animate.

let mousedownTs = null;
let xDrag = 0, yDrag = 0;

let doDebugEvents = true;

let preClickMode = 'spinning';
ctx.mode = 'spinning';  // This can also be 'dragging'.

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

ctx.lines = [];  // This will contain {from, to, elt} objects.

ctx.doDrawFaces = true;
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
].map(getStdColor).map(x => x.map(y => y * 0.8));

let lightDir = vector.unit([-1, -1, -2]);

let highlightedFaceElt = null;
let highlightedFaceIndex = -1;
let lastHighlightedFaceIndex = -1;

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
    style: 'font-family: sans-serif',
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

function didDrag() {
    let motion = xDrag + yDrag;
    console.log(`didDrag(): motion=${motion}.`);
    return motion > 5;
}

function logEvent(e) {
    if (!doDebugEvents) return;
    console.log(`${e.type} on ${e.target}`);
}

function getXYArray(pts, doPerspective) {

    if (doPerspective === undefined) doPerspective = true;

    // Transform all points.
    let p = matrix.mult(ctx.transform, pts);

    // Apply perspective.
    let xyArray = [];
    for (let i = 0; i < p[0].length; i++) {
        let [x, y, z] = [p[0][i], p[1][i], p[2][i]];
        let w = 1;
        if (doPerspective) w = z / ctx.zoom;
        xyArray.push({x: x / w, y: y / w, z, isVisible: z >= eyeZ});
    }
    return xyArray;
}

function updateLabelForDot(dot, xy) {
    let offset = 0.01;
    let c = draw.ctx.toCanvasScale;

    let s = `translate(${c * xy.x}, ${c * xy.y})`;
    dot.label.setAttribute('transform', `translate(${c * xy.x}, ${c * xy.y})`);
}

// Add the circle if there is one. For now, this will be rendered on top of
// everything else.
function renderCircle() {
    if (!ctx.circle) return;

    for (let path of ctx.circle.paths) path.remove();
    ctx.circle.paths = [];

    // 1. Find four corners around the circle. We want the near pair of corners
    // to have the same z coordinate, and the same for the far pair.

    // 1.a. Find a basis for the plane of the circle. This will be the rows
    //      of T. T[0] = n; T[1] is orth to z and to n.
    let n = getXYArray(matrix.transpose([ctx.circle.normal]), false)[0];
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
    let c = getXYArray(matrix.transpose([ctx.circle.center]), false)[0];
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
    let dctx = draw.ctx;
    let orig = [dctx.origin.x, dctx.origin.y];
    [start, end] = [start, end].map(
        x => vector.add(vector.scale(x, dctx.toCanvasScale), orig)
    );
    let degrees = theta / Math.PI * 180;
    for (let i = 0; i <= 1; i++) {
        let path = draw.add('path', ctx.circle.style);
        let j = isNearOnLeft ? 0 : 1;
        if (isNearOnLeft ^ (i === 1)) {
            draw.drawBehind();
        } else {
            draw.drawInFront();
        }
        let attrib = {
            d: `M ${start[0]} ${start[1]} ` +
               `A ${a} ${b} ${degrees} 0 ${i} ${end[0]} ${end[1]}`
        };
        draw.addAttributes(path, attrib);
        ctx.circle.paths.push(path);
    }
}

// This applies ctx.fadeRange to stdBaseColor, using z, to arrive a color that
// is a fade from stdBaseColor down to white. The returned value is a color
// string that can be assigned, eg, to a `stroke` or `fill` style attribute.
function getFadeColor(stdBaseColor, z) {
    if (ctx.fadeRange === null) return getColorStr(stdBaseColor);
    let [a, b] = ctx.fadeRange;
    if (z < a) return getColorStr(stdBaseColor);
    if (z > b) return '#fff';
    let w = 1 - (z - a) / (b - a);
    let c = stdBaseColor;
    return getColorStr([
        c[0] * w + (1 - w),
        c[1] * w + (1 - w),
        c[2] * w + (1 - w)
    ]);
}

// Derive an [r, g, b] array from a color string. The values of r, g, and b are
// each in the range [0, 1]. This expects that the color string has no alpha
// value.
function getStdColor(colorStr) {
    console.assert(colorStr[0] === '#');
    let color = [];
    let nDigits = (colorStr.length === 7 ? 2 : 1);
    for (let i = 0; i < 3; i++) {
        let channelStr = colorStr.substr(1 + nDigits * i, nDigits);
        if (nDigits === 1) channelStr = channelStr + channelStr;
        color.push(parseInt(channelStr, 16) / 255);
    }
    return color;
}

// This converts a standard color array to a color string. A standard color
// array has [r, g, b] which each value in the range [0, 1].
function getColorStr(c) {
    const hex = d => Math.ceil(d * 255).toString(16).padStart(2, '0')
    return '#' + c.map(hex).join('');
}

function drawNormalLines() {
    let xys = getXYArray(ctx.normalLinePts);
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
        mainGroup.appendChild(pt.elt);
    }

    // 4. Draw any remaining interior lines.
    for (let line of ctx.lines) {
        // Case A: Internal lines not yet rendered.
        if (line.type === 'internal' && !line.elt.parentElement) {
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
    for (let pt of pts) {
        if (pt.elt.parentElement) continue;
        // Add any dependencies, eg lines adjacent to a dot.
        for (let dep of pt.deps) {
            if (!dep.parentElement) mainGroup.appendChild(dep);
        }
        if (pt.outline) mainGroup.appendChild(pt.outline);
        mainGroup.appendChild(pt.elt);
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
        elt.baseColor  = getStdColor(dotStyle.fill);
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
        let sign = Math.sign(vector.dot(n, center));
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
        for (let j = 0; j < face.length; j++) faceP.push(P[face[j]]);
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
        ctx.facePolygons.push(draw.polygon([], facePolyStyle));

        // TODO Move mouse event setup to its own function.
        let polygon = ctx.facePolygons[ctx.facePolygons.length - 1];
        polygon.setAttribute('stroke-width', '4');
        polygon.addEventListener('mouseover', e => {
            logEvent(e);
            highlightedFaceElt = polygon;
            lastHighlightedFaceIndex = i;
            if (ctx.mode !== 'dragging') {
                // XXX and below
                // TODO Also send in an awayFrom value.
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
}

function moveElt(elt, dx, dy) {
    elt.setAttribute('x', parseInt(elt.getAttribute('x')) + dx);
    elt.setAttribute('y', parseInt(elt.getAttribute('y')) + dy);
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
            dot.label = draw.add('g');
            let r = draw.rect({x: 0, y: 0}, whiteStyle, dot.label);
            let t = draw.text({x: 0, y: 0}, label, textStyle, dot.label);

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
            moveElt(r, -wText / 2, hText / 2);
            moveElt(t, -wText / 2, hText / 2);
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

// This expects `pts` to be an array of 3d points, with each point being an
// array of 3 numbers.
export function addPoints(pts, labels) {
    for (let pt of pts) {
        appendPoint(pt);
    }
    addAnyNewDots();
    if (labels) ctx.labels = labels;
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
        line.elt   = draw.line(fromPt, toPt, style, edgeGroup);
        line.elt.setAttribute('pointer-events', 'none');
        line.baseColor = getStdColor(style.stroke);
        line.coreColor = line.baseColor;  // Save to undo edge highlights.
        line.coreWidth = style['stroke-width'];
        ctx.lines.push(line);
    }
    ctx.slices = slices;  // If no edges are highlighted, undefined is ok.
}

// This expects each face to be an array of indexes into `pts`.
// Each face is expected to live in a plane, and it's expected that the points
// are convex and listed counterclockwise.
export function addFaces(faces) {
    ctx.faces.push(...faces);
    addAnyNewNormals();
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

// XXX Clean up this function.
export function makeDraggable() {
    draw.ctx.svg.addEventListener('mousedown', e => {
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
    draw.ctx.svg.addEventListener('mouseup', e => {
        logEvent(e);
        if (highlightedFaceElt) {
            toggleFaceLabels(lastHighlightedFaceIndex, true);
        }

        // If this was a long click, we don't treat it as a click.
        // However, if a long click had zero movement, we still count it.
        if (e.timeStamp - mousedownTs > 500 || didDrag()) {
            let d = e.timeStamp - mousedownTs;
            ctx.mode = 'paused';
            if (e.timeStamp - mousedownTs > 500) {
                console.log(`Ignoring click: long (${d} ms).`);
            } else {
                console.log(`Ignoring click: didDrag.`);
            }
            return;
        }

        let fromTo = {
            spinning: 'paused',
            dragging: 'paused',
            paused:   'spinning'
        };
        ctx.mode = fromTo[preClickMode];
    });
    draw.ctx.svg.addEventListener('click', e => {
        logEvent(e);

    });
    draw.ctx.svg.addEventListener('mousemove', e => {
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

        let scale = draw.ctx.toCanvasScale;
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

// XXX Move to public?
export function updatePoints() {

    let xys = getXYArray(ctx.pts);
    // We may use the lineXYs early to help place labels around dots.
    let lineXYs = getXYArray(ctx.normalLinePts, false);

    for (let i = 0; i < xys.length; i++) {
        let r = 0.04 / xys[i].z;
        let outlineR = 2 * r;
        draw.moveCircle(ctx.dots[i], xys[i], r);
        if (ctx.dots[i].label) updateLabelForDot(ctx.dots[i], xys[i]);
        draw.moveCircle(ctx.outlines[i], xys[i], outlineR);
        if (ctx.fadeRange) {
            let color = getFadeColor(ctx.dots[i].baseColor, xys[i].z);
            ctx.dots[i].setAttribute('fill', color);
        }
        ctx.dots[i].hidden = !xys[i].isVisible;
        ctx.outlines[i].hidden = !xys[i].isVisible;
    }

    for (let line of ctx.lines) {
        let [from, to] = [xys[line.from], xys[line.to]];
        if (ctx.fadeRange) {
            let avgZ  = (xys[line.from].z + xys[line.to].z) / 2;
            let color = getFadeColor(line.baseColor, avgZ);
            line.elt.setAttribute('stroke', color);
        }
        draw.moveLine(line.elt, from, to);
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
        draw.movePolygon(ctx.facePolygons[i], faceXYs);
        let isHidden = vector.dot(
            [normalXYs[i].x, normalXYs[i].y, normalXYs[i].z],
            [lineXYs[2 * i].x, lineXYs[2 * i].y, lineXYs[2 * i].z]
        ) > 0;
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
        polygon.setAttribute('fill', `rgba(${ell}, ${ell}, ${ell}, ${alpha})`);

        if (!isHidden) {
            for (let j of face) xys[j].isForeground = true;
        }
    }

    orderElts(xys);

    if (ctx.doDrawNormalLines) drawNormalLines();

    // XXX I will need to integrate this with the z order of things.
    renderCircle();
}

