/* octohedron.js
 *
 * Render a rotating octohedron with space2.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as space2 from './space2.js';
import * as vector from './vector.js';


// ______________________________________________________________________
// Globals

let zDist = 4;


// ______________________________________________________________________
// Functions

// Ensure that elt[prop] exists; if not, create it as an empty array.
// Push newItem onto the end of that array.
function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

function areOpposite(a, b) {
    return a[0] === -b[0] && a[1] === -b[1] && a[2] === -b[2];
}

function getCubePtsLinesFaces() {

    let pts = [];
    let lines = [];
    let faceMap = {};

    let idx = 0;
    for (let axis = 0; axis < 3; axis++) {
        for (let coord = -1; coord < 3; coord += 2) {
            let pt = [0, 0, 0];
            pt[axis] = coord;
            pts.push(pt);
            for (let xSign = -1; xSign < 3; xSign += 2) {
                for (let ySign = -1; ySign < 3; ySign += 2) {
                    let zSign = 1;
                    let w = [xSign, ySign, zSign];
                    let p = vector.dot(w, pt);
                    push(faceMap, `${w}:${p}`, idx);
                }
            }
            idx++;
        }
    }
    for (let i = 0; i < pts.length - 1; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            if (areOpposite(pts[i], pts[j])) continue;
            lines.push({from: i, to: j});
        }
    }

    let faces = Object.values(faceMap);
    return [pts, lines, faces];
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    space2.setArtist(init.setup2());

    let [pts, lines, faces] = getCubePtsLinesFaces();

    // Add a small degree of fading for the farther-back points and lines.
    space2.ctx.fadeRange = [6, 16];

    space2.ctx.zoom = 3;
    space2.addPoints(pts);
    space2.addLines(lines);
    space2.addFaces(faces);

    space2.makeDraggable();
    space2.ctx.rotationsPerSec = 0.05;
    space2.ctx.rotationSign = -1;
    space2.setZDist(zDist);
    space2.rotateAround([0.3, -1, 0.5]);

    space2.animate();
});
