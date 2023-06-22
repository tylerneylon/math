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
// 3D-Object Handling Functions
//
// Longer-term, it will make sense to put these into their
// own module (file). It will make sense for 3D objects to
// be instances of a dedicated class. For development, I'll work
// with functions (not a class).
//

function clone3DObject(obj) {
    return obj.map(structuredClone);
}

// This adds the 3D vector v to all the points in object `obj`.
function translate3DObject(obj, v) {
}



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

    let obj = [pts, lines, faces];

    // Add a small degree of fading for the farther-back points and lines.
    // space.ctx.fadeRange = [8, 10];

    space.ctx.zoom = 2;
    space.addObject(obj);
    // space.addPoints(pts);
    // space.addLines(lines);
    // space.addFaces(faces);

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

    if (false) {
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
