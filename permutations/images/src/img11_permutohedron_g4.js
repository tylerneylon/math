/* img11_permutohedron_g4.js
 *
 * Render a rotating 3d permutohedron of G_4.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm2  from './perm2.js';
import * as space2 from './space2.js';


// ______________________________________________________________________
// Globals

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 8;


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let [pts, labels]   = perm2.getG4PointsIn3D();
    let [lines, slices] = perm2.getEdgeIndexesLex(4);
    let faces           = perm2.getG4FacesIn3D();

    init.addContainerSwitcher((artist) => {

        space2.reset();

        // Add a small degree of fading for the farther-back points and lines.
        space2.ctx.fadeRange = [6, 16];

        space2.setArtist(artist);
        space2.ctx.zoom = 3;
        space2.addPoints(pts);
        space2.addLines(lines);

        space2.addFaces(faces);

        space2.makeDraggable();

        // Add to the z value of all points.
        let t = matrix.eye(4);
        t[2][3] = zDist;
        space2.setTransform(t);

        space2.ctx.rotationsPerSec = 0.05;
        space2.ctx.rotationSign = -1;
        space2.setZDist(zDist);
        space2.rotateAround([0.3, -1, 0.5]);

        space2.animate();
    });

});
