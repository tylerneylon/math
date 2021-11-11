/* img17_draggable_g4_scan.js
 *
 * Render an animated circle that goes around the G_4 permutahedron.
 * This is like img13 except that it is draggable, and the exploded version of
 * the graph (in 2d) changes in realtime as you drag the permutohedron.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

// I'm currently designing things to look good at size 500x500 per svg.
let size = 500;

let svg1 = null;
let svg2 = null;

let svg1Scale = 0.5;
let svg2Scale = 0.47;

let lastTs = null;
let totalSeconds = 0;
let zDist = 4.8;
let R = 0;

let frameNum = 0;
let showEveryNthFrame = 1;

// Scanning 2d circle parameters.
let circleElt = null;
let [rMin, rMax] = [0.1, 0.9];
let [xMin, xMax] = [null, null];  // These will be based on pts below.

let pts3d       = null;
let labels      = null;
let pts2d       = null;
let pt2dElts    = null;
let lines2d     = null;

let pause = 1.0;

let circleStyle = {
    stroke: '#66a',
    fill:   'transparent',
    'stroke-width': 8
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let speed = 0.8;
    let doShow = (frameNum % showEveryNthFrame === 0);

    if (lastTs !== null && doShow) {
        let w = (totalSeconds * speed) % (Math.PI + pause);
        let doMoveCircle = (w < Math.PI);

        let t = -Math.cos(w);
        let x = R * t;
        let r = rMin + (rMax - rMin) * (x - xMin) / (xMax - xMin);
        r = Math.max(0.001, r);  // Ensure r >= 0.

        draw.ctx.svg = svg1;
        draw.setScale(size * svg1Scale);
        if (doMoveCircle) {
            space.setCircle(
                [x, 0, 0],
                Math.sqrt(R * R - x * x),
                [1, 0, 0],
                circleStyle
            );
            space.updatePoints();
        }
        pts3d = matrix.mult(space.ctx.rotateMat, space.ctx.pts);
        pts3d = matrix.transpose(pts3d).map(x => x.slice(0, 3));
        for (let i = 0; i < pts3d.length; i++) {
            // The `null` here is for the outline; which is used for 2d plots
            // but not for 3d plots (since space.js owns those outlines).
            updateDot(pts3d[i], space.ctx.dots[i], w, x);
        }

        draw.ctx.svg = svg2;
        draw.setScale(size * svg2Scale);
        pts2d = util.explode3DPoints(pts3d, labels, rMin, rMax);
        for (let i = 0; i < pts2d.length; i++) {
            updateDot(pts2d[i], pt2dElts[i], w, x);
        }
        for (let line of lines2d) {
            let from = xy(pts2d[line.fromIndex]);
            let to   = xy(pts2d[line.toIndex]);
            draw.moveLine(line, from, to);
        }
        if (doMoveCircle) {
            draw.moveCircle(circleElt, {x: 0, y: 0}, r);
        }
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;
    frameNum++;

    // Leaving this here as this allows us to turn on a little animation in svg1
    // if we want to. This reveals a current weakness in space.js, which is that
    // it assumes draw's context remains the same for the sake of its animation
    // frame handler.
    draw.ctx.svg = svg1;
    draw.setScale(size * svg1Scale);

    window.requestAnimationFrame(drawFrame);
}

function updateDot(pt, elt, w, x) {

    let maxHighlight = 0.8;
    let k = maxHighlight / pause;
    let ptHighlight = 0;
    let highlightColor = [0.1, 0.3, 1];
    let highlightRadius = 10;

    let dot = (pt.length === 2 ? elt.dot : elt);

    let wx = 0;
    if (pt.length === 2) {
        let ptR = vector.len(pt);
        x = xMin + (xMax - xMin) * (ptR - rMin) / (rMax - rMin);
        let t = x / R;
        wx = Math.acos(-t);
    } else {
        let t = pt[0] / R;
        wx = Math.acos(-t);
    }
    if (w >= wx) {
        ptHighlight = maxHighlight - (w - wx) * k;
    }
    ptHighlight = Math.max(0, ptHighlight);
    let [a, b] = [1 - ptHighlight, ptHighlight];
    for (let i = 0; i < 3; i++) {
        util.ctx.stdColor[i] = a * dot.coreFill[i] + b * highlightColor[i];
    }
    dot.setAttribute('fill', util.getColorStr());
    let radius = a * dot.coreRadius + b * highlightRadius;
    if (pt.length === 2) {
        draw.moveCircle(dot, {x: pt[0], y: pt[1]});
        draw.moveCircle(elt.outline, {x: pt[0], y: pt[1]});
        for (let textElt of elt.textElts) {
            let eps = 0.01;
            draw.moveText(textElt, {x: pt[0] + eps, y: pt[1] - eps});
        }
    }
    dot.setAttribute('r', radius);
}

function xy(arrayPt) {
    return {x: arrayPt[0], y: arrayPt[1]};
}

function ensureCoreFill(dots) {
    if (dots === undefined) {
        for (let elts of pt2dElts) {
            let dot = elts.dot;
            dot.coreFill = util.getStdColor(dot.getAttribute('fill'));
            dot.coreRadius = dot.getAttribute('r');
        }
    } else {
        for (let dot of dots) {
            dot.coreFill = util.getStdColor(dot.getAttribute('fill'));
            dot.coreRadius = dot.getAttribute('r');
        }
    }
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    svg1 = init.setup(size, size, 'svg1');
    svg2 = init.setup(size, size, 'svg2');
    draw.ctx.svg = svg1;

    // ____________________________________________________________
    // Set up svg1 with the scanning circle.

    [pts3d, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    R = vector.len(pts3d[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [2, 8.5];
    space.ctx.zoom = 1.6;
    space.ctx.dotSize = 0.035;
    space.addPoints(pts3d);
    space.addLines(lines);

    if (true) {
        space.makeDraggable();
        space.ctx.rotationsPerSec = 0.01;
        space.ctx.mode = 'paused';
        space.rotateAround([0.3, -1, 0.5]);
        space.animate();
    }

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);
    space.setZDist(zDist);
    ensureCoreFill(space.ctx.dots);

    // ____________________________________________________________
    // Set up svg2 with the exploded permutohedron graph.

    let xValues = pts3d.map(x => x[0]);
    [xMin, xMax] = [Math.min(...xValues), Math.max(...xValues)];
    pts2d = util.explode3DPoints(pts3d, labels, rMin, rMax);
    console.log('pts2d just after explosion:');
    console.log(pts2d);
    let ptMap = {};
    for (let i in pts2d) {
        let pt = pts2d[i];
        ptMap[pt.label] = {x: pt[0], y: pt[1], i};
    }
    draw.ctx.svg = svg2;
    draw.setScale(size * svg2Scale);
    perm.renderCtx.labelStyle = 'mainOnly';
    console.log('labels:');
    console.log(labels);
    // The `true` here means to exclude hit dots.
    // It's more trouble than I'd like to move the hit dots with all else.
    [pts2d, pt2dElts, lines2d] = perm.drawGraphWithPtMap(ptMap, 4, lines, true);
    ensureCoreFill();
    circleElt = draw.circle({x: 0, y: 0}, rMin, circleStyle);
    draw.addAttributes(circleElt, {'pointer-events': 'none'});

    window.requestAnimationFrame(drawFrame);
});