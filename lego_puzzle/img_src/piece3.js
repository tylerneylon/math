/* piece1.js
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

// This is for debugging.
function prObj(obj) {
    for (let [k, v] of Object.entries(obj)) {
        console.log(k, v);
    }
}

window.addEventListener('DOMContentLoaded', (event) => {

    let artist = init.setup();
    space.setArtist(artist);
    space.ctx.doDrawDots = false;
    // space.ctx.doDrawNormalLines = true;  // XXX
    // space.ctx.doDrawFaces = false;  // XXX

    // Set up the piece points and lines.
    let pts = [];
    let lines = [];

    let idx = 0;
    let bottom = [];
    let faceMap = {};
    // These are index stacks.
    let [xSt, ySt, zSt] = [[], [], []];
    for (let z = 0; z <= 1; z++) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {

                let pt = [x, y, z];
                pts.push(pt);

                // Push the top faces.
                if (z === 1) {
                    for (let xx = x; xx >= x - 1; xx--) {
                        for (let yy = y; yy >= y - 1; yy--) {
                            if (-xx < 2 && xx < 1 && -yy < 2 && yy < 1) {
                                util.push(faceMap, `${xx}:${yy}`, idx);
                            }
                        }
                    }
                }

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

    let faces = Object.values(faceMap);
    for (let face of faces) {
        face.style = {fill: '#f00'};
    }

    // Add a small degree of fading for the farther-back points and lines.
    // space.ctx.fadeRange = [8, 10];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    space.setTransform(matrix.mult(
        matrix.translate([0, 0, 6]),
        matrix.rotateAroundX(Math.PI * 0.19),  // 0.29
        matrix.rotateAroundY(Math.PI * 0.2),
        matrix.rotateAroundX(Math.PI * 0.5)
    ));

    if (true) {
        space.setZDist(6);
        space.setAngleMat(matrix.mult(
            matrix.rotateAroundX(Math.PI * 0.29),
            matrix.rotateAroundY(Math.PI * 0.2),
            matrix.rotateAroundX(Math.PI * 0.5)
        ));
        space.ctx.rotationsPerSec = 0.2;
        space.makeDraggable();
        space.animate();
    }
});
