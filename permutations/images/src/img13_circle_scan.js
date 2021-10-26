/* img13_circle_scan.js
 *
 * Render an animated circle that goes around the
 * G_4 permutahedron.
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

let svg1 = null;
let svg2 = null;

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

let circleStyle = {
    stroke: '#88a',
    fill:   'transparent',
    'stroke-width': 8
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let speed = 1.0;
    let doShow = (frameNum % showEveryNthFrame === 0);

    if (lastTs !== null && doShow) {
        let t = Math.sin(totalSeconds * speed);
        let x = R * t;

        draw.ctx.svg = svg1;
        space.setCircle(
            [x, 0, 0],
            Math.sqrt(R * R - x * x),
            [1, 0, 0],
            circleStyle
        );
        space.updatePoints();

        draw.ctx.svg = svg2;
        let r = rMin + (rMax - rMin) * (x - xMin) / (xMax - xMin);
        r = Math.max(0.001, r);  // Ensure r >= 0.
        draw.moveCircle(circleElt, {x: 0, y: 0}, r);
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;
    frameNum++;

    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    // I'm currently designing things to look good at size 500x500 per svg.
    let size = 380;  // 500;
    svg1 = init.setup(size, size, 'svg1');
    svg2 = init.setup(size, size, 'svg2');
    draw.ctx.svg = svg1;

    // ____________________________________________________________
    // Set up svg1 with the scanning circle.

    let [pts, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    R = vector.len(pts[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [2, 8.5];
    space.ctx.zoom = 1.6;
    space.ctx.dotSize = 0.035;
    space.addPoints(pts);
    space.addLines(lines);

    if (false) {
        // space.makeDraggable();
        space.ctx.rotationsPerSec = 0.01;
        space.animate();
    }

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);
    space.setZDist(zDist);

    // ____________________________________________________________
    // Set up svg2 with the exploded permutohedron graph.

    let xValues = pts.map(x => x[0]);
    [xMin, xMax] = [Math.min(...xValues), Math.max(...xValues)];
    let pts2d = util.explode3DPoints(pts, labels, rMin, rMax);
    let ptMap = {};
    for (let pt of pts2d) {
        ptMap[pt.label] = {x: pt[0], y: pt[1]};
    }
    draw.ctx.svg = svg2;
    perm.renderCtx.labelStyle = 'mainOnly';
    perm.drawGraphWithPtMap(ptMap, 4, lines);
    circleElt = draw.circle({x: 0, y: 0}, rMin, circleStyle);
    draw.addAttributes(circleElt, {'pointer-events': 'none'});

    window.requestAnimationFrame(drawFrame);
});
