/* cube_test2.js
 *
 * Render a rotating cube with space.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as space  from './space.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

let zDist = 8;


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    space.setArtist(init.setup());

    // Set up the piece points and lines.
    let pts = [];
    let lines = [];

    let idx = 0;
    let bottom = [];
    // These are index stacks.
    let [xSt, ySt, zSt] = [[], [], []];
    for (let z = 0; z <= 1; z++) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {

                let pt = [x, y, z];
                pts.push(pt);

                if (x < 1) xSt.push(idx);
                if (x > -1) lines.push({from: xSt.shift(), to: idx});

                if (y < 1) ySt.push(idx);
                if (y > -1) lines.push({from: ySt.shift(), to: idx});

                if (z === 0) zSt.push(idx);
                if (z !== 0) lines.push({from: zSt.shift(), to: idx});

                idx++;
            }
        }
    }

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [6, 16];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);
    // space.addFaces(faces);

    space.makeDraggable();
    space.ctx.rotationsPerSec = 0.05;
    space.ctx.rotationSign = -1;
    space.setZDist(zDist);
    space.rotateAround([0.3, -1, 0.5]);

    space.animate();
});
