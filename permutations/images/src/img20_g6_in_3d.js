/* img20_g6_in_3d.js
 *
 * Render a rotating 3d mapping of G'_6 (down from 6d).
 * This image introduces a new dimension reduction approach which I'm calling
 * perspective projection, where we map (head, z) -> (head/z).
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 0.6;


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let [pts5d, labels] = perm.getGNPointsLessOne(6);
    // I noticed that #444 looks decent for G_5 and go transparent for G'_5.
    let [lines, slices] = perm.getEdgeIndexesLex(6, 'transparent');

    // Reduce the line widths.
    for (const line of lines) line.style['stroke-width'] = 0.7;

    let pts4d = util.explodeNDPoints(pts5d, labels, 0.7, 2.0);
    let pts3d = util.perspectiveProjectPoints(pts4d, labels, 10);

    // For a nice fade, find the min and max point distances.
    // Note that these will change a little with rotation.
    let dists = [];
    for (let p of pts3d) {
        dists.push(vector.len(p));
    }
    let [minPtDist, maxPtDist] = [Math.min(...dists), Math.max(...dists)];

    init.addContainerSwitcher((artist) => {

        space.reset();
        space.setArtist(artist);
        space.ctx.doDrawDots = false;

        space.ctx.fadeRange = [
            (minPtDist + zDist) * 0.8,
            (maxPtDist + zDist) * 1.0
        ];

        space.ctx.zoom = 3;
        space.addPoints(pts3d);
        space.addLines(lines);

        space.makeDraggable();

        // Add to the z value of all points.
        let t = matrix.eye(4);
        t[2][3] = zDist;
        space.setTransform(t);

        space.ctx.dotSize = 0;  // 0.02;
        space.ctx.rotationsPerSec = 0.05;
        space.ctx.rotationSign = -1;
        space.setZDist(zDist);
        space.rotateAround([0.3, -1, 0.5]);

    });

    space.animate();
});
