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

function highlightEdges(sliceName) {
    space.highlightEdges(sliceName);
}

// Set up an array of button elements (in buttonElts). Each button receives a
// mouseover handler which (a) underlines the hovered-over element,
// un-underlines the other elements, and (b) calls `handler` with the item in
// paramObjs with the same index as the hovered-over button element.
// The first button element is treated as the "default on" button.
function initButtonGroup(buttonElts, paramObjs, handler) {
    console.assert(buttonElts.length === paramObjs.length);
    for (let i = 0; i < buttonElts.length; i++) {
        let buttonElt = buttonElts[i];
        buttonElt.classList.add('hover-button');
        buttonElt.addEventListener('mouseover', e => {
            for (let b of buttonElts) {
                if (b === buttonElt) {
                    b.classList.add('underline');
                } else {
                    b.classList.remove('underline');
                }
            }
            handler(paramObjs[i]);
        });
    }

    // Underline the default button.
    buttonElts[0].classList.add('underline');
}

function setupButtons() {

    let buttonIds = [
        'none', '0', '1', '2', '3', '0,1', '0,2', '0,3', 'm1', 'm2', 'm3'
    ];
    let buttonElts = buttonIds.map(x => document.getElementById('edges-' + x));
    initButtonGroup(buttonElts, buttonIds, highlightEdges);

    let facesShowElt = document.getElementById('faces-show');
    let facesHideElt = document.getElementById('faces-hide');
    facesShowElt.classList.add('underline');
    facesShowElt.classList.add('hover-button');
    facesShowElt.addEventListener('mouseover', e => {
        space.ctx.doDrawFaces = true;
        facesHideElt.classList.remove('underline');
        facesShowElt.classList.add('underline');
    });

    facesHideElt.classList.add('hover-button');
    facesHideElt.addEventListener('mouseover', e => {
        space.ctx.doDrawFaces = false;
        facesShowElt.classList.remove('underline');
        facesHideElt.classList.add('underline');
    });
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let size = 600;
    init.setup(size);
    setupButtons();

    let pts             = perm.getG4PointsIn3D();
    let [lines, slices] = perm.getEdgeIndexesLex(4);
    let faces           = perm.getG4FacesIn3D();

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 12];

    space.ctx.zoom = 2.5;
    space.addPoints(pts);
    space.addLines(lines, slices);
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
