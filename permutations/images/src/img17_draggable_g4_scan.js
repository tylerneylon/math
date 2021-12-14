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

let artist1 = null;
let artist2 = null;

let scale1 = 0.5;
let scale2 = 0.95;

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

        if (doMoveCircle) {
            space.setCircle(
                [x, 0, 0],
                Math.sqrt(R * R - x * x),
                [1, 0, 0],
                circleStyle
            );
            space.updatePoints();
        }
        let sc = space.ctx;
        space.setTransform(matrix.mult(sc.transMat, sc.rotateMat));
        pts3d = matrix.mult(sc.rotateMat, sc.pts);
        pts3d = matrix.transpose(pts3d).map(x => x.slice(0, 3));
        for (let i = 0; i < pts3d.length; i++) {
            updateDot(artist1, pts3d[i], sc.dots[i], w, x);
        }

        pts2d = util.explode3DPoints(pts3d, labels, rMin, rMax);
        for (let i = 0; i < pts2d.length; i++) {
            updateDot(artist2, pts2d[i], pt2dElts[i], w, x);
        }
        for (let line of lines2d) {
            let from = xy(pts2d[line.fromIndex]);
            let to   = xy(pts2d[line.toIndex]);
            artist2.moveLine(line, from, to);
        }
        if (doMoveCircle) {
            artist2.moveCircle(circleElt, {x: 0, y: 0}, r);
        }

        artist1.render();
        artist2.render();
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;
    frameNum++;

    window.requestAnimationFrame(drawFrame);
}

function updateDot(artist, pt, elt, w, x) {

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
        artist.moveCircle(dot, {x: pt[0], y: pt[1]});
        artist.moveCircle(elt.outline, {x: pt[0], y: pt[1]});
        for (let textElt of elt.textElts) {
            let eps = 0.01;
            artist.moveText(textElt, {x: pt[0] + eps, y: pt[1] - eps});
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

    [pts3d, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    R = vector.len(pts3d[0]);

    let numContainers = 2;
    init.addContainerSwitcher(size, numContainers, (_artist1, _artist2) => {

        artist1 = _artist1;
        artist2 = _artist2;

        // ____________________________________________________________
        // Set up artist1 with the scanning circle.

        space.reset();

        space.setArtist(artist1);
        space.ctx.fadeRange = [2, 8.5];
        space.ctx.zoom = 1.6;
        space.ctx.dotSize = 0.035;
        space.addPoints(pts3d);
        space.addLines(lines);

        space.makeDraggable();
        space.ctx.rotationsPerSec = 0.01;
        space.ctx.mode = 'paused';

        // Add to the z value of all points.
        let t = matrix.eye(4);
        t[2][3] = zDist;
        space.setTransform(t);
        space.setZDist(zDist);
        ensureCoreFill(space.ctx.dots);

        // ____________________________________________________________
        // Set up artist2 with the exploded permutohedron graph.

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

        const a = 1.0 / scale2;
        artist2.setCoordLimits(-a, a, -a, a);
        perm.renderCtx.labelStyle = 'mainOnly';

        console.log('labels:');
        console.log(labels);

        // It's more trouble than I'd like to move the hit dots with all else.
        const params = {edgeStyles: lines, excludeHitDots: true};
        [pts2d, pt2dElts, lines2d] = perm.drawGraphWithPtMap(
            artist2,
            ptMap,
            4,
            params
        );
        ensureCoreFill();
        circleElt = artist2.addCircle({x: 0, y: 0}, rMin, circleStyle);
        draw.addAttributes(circleElt, {'pointer-events': 'none'});
    });

    window.requestAnimationFrame(drawFrame);
});
