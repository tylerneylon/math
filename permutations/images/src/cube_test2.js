/* cube_test2.js
 *
 * Render a rotating cube with space.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as space  from './space.js';


// ______________________________________________________________________
// Globals

let zDist = 8;


// ______________________________________________________________________
// Functions

// Ensure that elt[prop] exists; if not, create it as an empty array.
// Push newItem onto the end of that array.
function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

function getCubePtsLinesFaces() {

    let pts = [];
    let lines = [];

    let idx = 0;
    let [xStack, yStack] = [[], []];
    let faceMap = {};
    for (let x = -1; x < 3; x += 2) {
        for (let y = -1; y < 3; y += 2) {
            for (let z = -1; z < 3; z += 2) {
                if (x === -1) xStack.push(idx);
                if (y === -1) yStack.push(idx);
                let pt = [x, y, z];
                pts.push(pt);
                for (let i = 0; i < 3; i++) {
                    push(faceMap, `${i}:${pt[i]}`, idx);
                }
                if (x === 1) lines.push({from: xStack.shift(), to: idx});
                if (y === 1) lines.push({from: yStack.shift(), to: idx});
                if (z === 1) lines.push({from: idx - 1, to: idx});
                idx++;
            }
        }
    }
    let faces = Object.values(faceMap);

    return [pts, lines, faces];
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    init.setup();

    let [pts, lines, faces] = getCubePtsLinesFaces();

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 16];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    space.makeDraggable();
    space.ctx.rotationsPerSec = 0.05;
    space.ctx.rotationSign = -1;
    space.setZDist(zDist);
    space.rotateAround([0.3, -1, 0.5]);

    space.animate();
});
