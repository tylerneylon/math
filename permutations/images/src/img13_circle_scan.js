/* img13_circle_scan.js
 *
 * Render an animated circle that goes around the
 * G_4 permutahedron.
 *
 */


// ______________________________________________________________________
// Imports

// XXX needed?
import * as draw   from './draw.js';
import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

let lastTs = null;
let totalSeconds = 0;
let zDist = 8;
let R = 0;

let circleStyle = {
    stroke: '#88a',
    fill:   'transparent',
    'stroke-width': 8
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    if (lastTs !== null) {
        let t = Math.sin(totalSeconds * 1.1);
        let x = R * t;

        space.setCircle(
            [x, 0, 0],
            Math.sqrt(R * R - x * x),
            [1, 0, 0],
            circleStyle
        );
        space.updatePoints();
    }
    totalSeconds += (ts - lastTs) / 1000;
    lastTs = ts;

    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let size = 380;
    let svg1 = init.setup(size, size, 'svg1');
    let svg2 = init.setup(size, size, 'svg2');
    draw.ctx.svg = svg1;

    // ____________________________________________________________
    // Set up svg1 with the scanning circle.

    let [pts, labels]   = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    R = vector.len(pts[0]);

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 15];
    space.ctx.zoom = 1;
    space.addPoints(pts);
    space.addLines(lines);

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);

    // ____________________________________________________________
    // Set up svg2 with the exploded permutohedron graph.

    util.explode3DPoints(pts, labels);

    window.requestAnimationFrame(drawFrame);
});
