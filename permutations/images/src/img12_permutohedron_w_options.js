/* img12_permutohedron_w_options.js
 *
 * Render a rotating 3d permutohedron of G_4.
 * This differs from img11 in that the interface presents more options to the
 * user.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';


// ______________________________________________________________________
// Globals

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};

let zDist = 8;


// ______________________________________________________________________
// Functions

function setupButtons() {
    let facesShowElt = document.getElementById('faces-show');
    facesShowElt.classList.add('underline');
    facesShowElt.classList.add('hover-button');

    let facesHideElt = document.getElementById('faces-hide');
    facesHideElt.classList.add('hover-button');
}

// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let size = 600;
    init.setup(size);
    setupButtons();

    let pts   = perm.getG4PointsIn3D();
    let lines = perm.getEdgeIndexesLex(4);
    let faces = perm.getG4FacesIn3D();

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 16];

    space.ctx.zoom = 2.5;
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    space.makeDraggable();

    // Add to the z value of all points.
    let t = matrix.eye(4);
    t[2][3] = zDist;
    space.setTransform(t);

    space.ctx.rotationsPerSec = 0.05;
    space.ctx.rotationSign = -1;
    space.setZDist(zDist);
    space.rotateAround([0.3, -1, 0.5]);

    space.animate();
});
