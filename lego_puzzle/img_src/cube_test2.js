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

    let [pts, lines, faces] = util.getCubePtsLinesFaces();

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
