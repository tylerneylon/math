/* img19_g5_in_3d.js
 *
 * Render a rotating 3d mapping of G_5 (down from 5d).
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 7;


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();

    let [pts4d, labels] = perm.getGNPointsLessOne(5);
    // I noticed that #444 looks decent for G_5 and go transparent for G'_5.
    let [lines, slices] = perm.getEdgeIndexesLex(5, 'transparent');

    // XXX
    // let [pts, labels]   = perm.getG4PointsIn3D();
    // let [lines, slices] = perm.getEdgeIndexesLex(4);
    // let faces           = perm.getG4FacesIn3D();

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [0, 11];

    // XXX tmp
    // for (let i in pts) pts[i] = pts[i].slice(0, 3);

    let pts3d = util.explodeNDPoints(pts4d, labels, 0.7, 2.0);

    space.ctx.zoom = 3;
    space.addPoints(pts3d);
    space.addLines(lines);
    // space.addFaces(faces);

    space.makeDraggable();

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);

    space.ctx.dotSize = 0.035;
    space.ctx.rotationsPerSec = 0.05;
    space.ctx.rotationSign = -1;
    space.setZDist(zDist);
    space.rotateAround([0.3, -1, 0.5]);

    space.animate();
});
