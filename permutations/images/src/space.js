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
    '#f00',
    '#f80',
    '#ff0',
    '#0f0',
    '#0ff',
    '#00f'
].map(getStdColor).map(x => x.map(y => y * 0.8));

let lightDir = vector.unit([-1, -1, -2]);

let highlightedFaceElt = null;
let highlightColor = '#0af';

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

let eyeZ = 0.001;

// Groups.
let mainGroup    = null;
let dotGroup     = null;
let outlineGroup = null;
let edgeGroup    = null;


// ______________________________________________________________________
// Internal functions.

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

function updatePoints() {

    let xys = getXYArray(ctx.pts);

    for (let i = 0; i < xys.length; i++) {
        let r = 0.04 / xys[i].z;
        let outlineR = 2 * r;
        draw.moveCircle(ctx.dots[i], xys[i], r);
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
    let lineXYs   = getXYArray(ctx.normalLinePts, false);
    for (let i = 0; i < ctx.faces.length; i++) {
        let face = ctx.faces[i];
        let faceXYs = [];
        for (let j = 0; j < face.length; j++) faceXYs.push(xys[face[j]]);
        draw.movePolygon(ctx.facePolygons[i], faceXYs);
        let isHidden = vector.dot(
            [normalXYs[i].x, normalXYs[i].y, normalXYs[i].z],
            [lineXYs[2 * i].x, lineXYs[2 * i].y, lineXYs[2 * i].z]
        ) > 0;
        if (!ctx.doDrawFaces) isHidden = true;
        for (let line of face.lines) line.isForeground = !isHidden;
        let polygon = ctx.facePolygons[i];
        polygon.setAttribute('display', isHidden ? 'none' : 'hi');

        // Adjust alpha and color a bit for a little more 3d effect.
        let towardLight = vector.dot(
            [normalXYs[i].x, normalXYs[i].y, normalXYs[i].z],
            lightDir
        );
        // let ell = Math.floor(towardLight * 45) + 210;
        let ell = Math.floor(towardLight * 40) + 215;
        let alpha = (towardLight ** 2) * 0.3 + 0.4;  // Between 0.4 and 0.8.
        //let alpha = (towardLight ** 2);
        //let alpha = 0.6;
        // alpha = 0.8;  // XXX
        // ell = Math.floor(towardLight * 150) + 105;
        polygon.setAttribute('fill', `rgba(${ell}, ${ell}, ${ell}, ${alpha})`);

        if (!isHidden) {
            for (let j of face) xys[j].isForeground = true;
        }
    }

    orderElts(xys);

    if (ctx.doDrawNormalLines) drawNormalLines();
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
        polygon.addEventListener('mouseover', function () {
            highlightedFaceElt = polygon;
            if (ctx.mode !== 'dragging') {
                polygon.setAttribute('stroke', '#0af');
            }
        });
        polygon.addEventListener('mouseout', function () {
            polygon.setAttribute('stroke', 'transparent');
            if (highlightedFaceElt === polygon) {
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

export function setTransform(t) {
    ctx.transform = t;
    updatePoints();
}

// XXX Clean up this function.
export function makeDraggable() {
    draw.ctx.svg.addEventListener('mousedown', e => {
        ctx.mousePt = [e.offsetX, e.offsetY];
        if (highlightedFaceElt) {
            highlightedFaceElt.setAttribute('stroke', 'transparent');
        }
    });
    draw.ctx.svg.addEventListener('mouseup', e => {
        if (highlightedFaceElt) {
            highlightedFaceElt.setAttribute('stroke', highlightColor);
        }
    });
    draw.ctx.svg.addEventListener('click', e => {
        let fromTo = {
            spinning: 'paused',
            dragging: 'paused',
            paused:   'spinning'
        };
        ctx.mode = fromTo[ctx.mode];
    });
    draw.ctx.svg.addEventListener('mousemove', e => {
        if ((e.buttons & 1) === 0) {
            if (ctx.mode === 'dragging') ctx.mode = 'paused';
            return;
        }
        ctx.mode = 'dragging';
        let delta = vector.sub([e.offsetX, e.offsetY], ctx.mousePt);
        ctx.mousePt = [e.offsetX, e.offsetY];

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
        }
        line.elt.setAttribute('stroke-width', w);
    }
}

export function animate() {
    window.requestAnimationFrame(setupFrame);
}

