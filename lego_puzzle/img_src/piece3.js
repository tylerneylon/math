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
                                util.push(faceMap, `${xx}:${yy}:`, idx);
                            }
                        }
                    }
                }
                // Push the side faces.
                if (x === -1) {
                    for (let yy = y; yy >= y - 1; yy--) {
                        if (-1 <= yy && yy <= 0) {
                          util.push(faceMap, `:${yy}:0`, idx);
                        }
                    }
                }
                if (y === -1) {
                    for (let xx = x; xx >= x - 1; xx--) {
                        if (-1 <= xx && xx <= 0) {
                          util.push(faceMap, `${xx}::0`, idx);
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

    // XXX
    prObj(faceMap);

    let faces = Object.values(faceMap);
    for (let face of faces) {
        face.style = {fill: '#f00'};
    }

    // Add a small degree of fading for the farther-back points and lines.
    // space.ctx.fadeRange = [8, 10];

    space.ctx.zoom = 2;
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    // XXX
    pts   = structuredClone(pts);

    let newLines = [];
    for (let i = 0; i < lines.length; i++) {
        newLines[i] = Object.assign({}, lines[i]);
        newLines[i].from += 18;
        newLines[i].to += 18;
    }
    lines = newLines;

    faces = structuredClone(faces);
    for (let face of faces) {
        face.style = {fill: '#0f0'};
        for (let i = 0; i < 4; i++) face[i] += 18;
    }
    for (let pt of pts) {
        pt[2] += 1.1;
    }
    space.addPoints(pts);
    space.addLines(lines);
    space.addFaces(faces);

    space.setTransform(matrix.mult(
        matrix.translate([0, 0, 6]),
        matrix.rotateAroundX(Math.PI * 0.19),  // 0.29
        matrix.rotateAroundY(Math.PI * 0.2),
        matrix.rotateAroundX(Math.PI * 0.5)
    ));

    // XXX
    let numCalls = 0;

    // odd < 0
    // 0 < even
    // odd and even do not compare
    // otherwise the order is the same as normal numbers
    function cmp(a, b) {
        numCalls++;
        console.log('cmp', a, b);
        console.log(`numCalls = ${numCalls}`);
        if (a === 0) return b === 0 ? '=' : (b % 2 === 0 ? '<' : '>');
        if (b === 0) return a % 2 === 0 ? '>' : '<';
        if (a % 2 !== b %2) return null;
        return a < b ? '<' : (a > b ? '>' : '=');
    }

    console.log('0 cmp 0', cmp(0, 0));
    console.log('0 cmp 1', cmp(0, 1));
    console.log('1 cmp 0', cmp(1, 0));
    console.log('0 cmp 2', cmp(0, 2));
    console.log('0 cmp 3', cmp(0, 3));
    console.log('3 cmp 1', cmp(3, 1));
    console.log('2 cmp 1', cmp(2, 1));

    debugger;

    let sorted = space.sortWithPartialOrder([0, 1, 2, 3, 4, 5, 6, 7], cmp);
    console.log('sorted result:');
    console.log(sorted);

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
