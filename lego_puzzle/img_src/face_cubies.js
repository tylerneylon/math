/* piece2.js
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

let blankStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 0
};


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    let artist = init.setup();
    space.setArtist(artist);
    space.ctx.doDrawDots = false;
    space.ctx.doShadeFaces = false;

    // Set up the piece points and lines.
    let pts = [];
    let lines = [];

    let idx = 0;
    let bottom = [];
    // These are index stacks.
    let [xSt, ySt, zSt] = [[], [], []];
    let faceMap = {};
    for (let x = 0; x <= 3; x++) {
        for (let y = 0; y <= 3; y++) {
            for (let z = 0; z <= 3; z++) {

                let s = null;

                let pt = [x, y, z];
                pts.push(pt);

                let [xMod, yMod, zMod] = [x % 3, y % 3, z % 3];

                s = (y === 0 || z === 3) ? thinStyle : blankStyle;
                if (!yMod && !zMod) s = thickStyle;
                if (x === 0 && (z > 0 || y === 0)) xSt.push(idx);
                if (x === 3 && (z > 0 || y === 0)) {
                    lines.push({from: xSt.shift(), to: idx, style: s});
                }

                s = (x === 0 || z === 3) ? thinStyle : blankStyle;
                if (!xMod && !zMod) s = thickStyle;
                if (y === 0 & (z > 0 || x === 0)) ySt.push(idx);
                if (y === 3 & (z > 0 || x === 0)) {
                    lines.push({from: ySt.shift(), to: idx, style: s});
                }

                s = (x === 0 || y === 0) ? thinStyle : blankStyle;
                if (!xMod && !yMod) s = thickStyle;
                if (z === 0 && x * y === 0) zSt.push(idx);
                if (z === 3 && x * y === 0) {
                    lines.push({from: zSt.shift(), to: idx, style: s});
                }

                // Update the faceMap.
                let oneOrTwo = (x => (x == 1 || x == 2));
                if (x === 0 && oneOrTwo(y) && oneOrTwo(z)) {
                    util.push(faceMap, 'x', idx);
                }
                if (y === 0 && oneOrTwo(x) && oneOrTwo(z)) {
                    util.push(faceMap, 'y', idx);
                }
                if (z === 3 && oneOrTwo(x) && oneOrTwo(y)) {
                    util.push(faceMap, 'z', idx);
                }

                idx++;
            }
        }
    }

    let faces = Object.values(faceMap);
    for (let face of faces) face.style = {fill: '#07c'};

    // Add a small degree of fading for the farther-back points and lines.
    space.ctx.fadeRange = [10, 17];

    space.ctx.zoom = 3;
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    space.setTransform(matrix.mult(
        matrix.translate([-0.3, 2.7, 10]),
        matrix.rotateAroundX(Math.PI * 0.17),
        matrix.rotateAroundY(Math.PI * 0.2),
        matrix.rotateAroundX(Math.PI * 0.5)
    ));
});
