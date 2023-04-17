/* cube_test2.js
 *
 * Render a rotating cube with space.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as space  from './space.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

let zDist = 8;

let thickStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 3
};

let thinStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 1
};


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let artist = init.setup();
    space.setArtist(artist);
    space.ctx.doDrawDots = false;

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

                let s = (y === 0 ? thinStyle : thickStyle);
                if (x < 1) xSt.push(idx);
                if (x > -1) lines.push({from: xSt.shift(), to: idx, style: s});

                s = (x === 0 ? thinStyle : thickStyle);
                // s = thickStyle;
                if (y < 1) ySt.push(idx);
                if (y > -1) lines.push({from: ySt.shift(), to: idx, style: s});

                s = (x * y !== 0 ? thickStyle : thinStyle);
                if (z === 0) zSt.push(idx);
                if (z !== 0) lines.push({from: zSt.shift(), to: idx, style: s});

                idx++;
            }
        }
    }

    // Add a small degree of fading for the farther-back points and lines.
    // space.ctx.fadeRange = [8, 10];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);

    space.setTransform(matrix.mult(
        matrix.translate([0, 0, 6]),
        matrix.rotateAroundX(Math.PI * 0.29),
        matrix.rotateAroundY(Math.PI * 0.2),
        matrix.rotateAroundX(Math.PI * 0.5)
    ));

    if (false) {
        space.setZDist(6);
        space.setAngleMat(matrix.mult(
            matrix.rotateAroundX(Math.PI * 0.29),
            matrix.rotateAroundY(Math.PI * 0.2),
            matrix.rotateAroundX(Math.PI * 0.5)
        ));
        space.ctx.rotationsPerSec = 0;
        space.animate();
    }
});
