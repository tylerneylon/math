/* piece8.js
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
    stroke: '#555',  // '#444',
    fill:   'transparent',
    'stroke-width': 1.5
};

let thinStyle = {
    stroke: '#555',  // '#444',
    fill:   'transparent',
    'stroke-width': 0.5
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
    return obj.map(x => structuredClone(x));
}

// This adds the 3D vector v to all the points in object `obj`.
function translate3DObject(obj, v) {
    for (let [i, pt] of obj[0].entries()) {
        obj[0][i] = pt.map((x, j) => x + v[j]);
    }
}

function rotate3DObjectAroundXAxis(obj, angle) {
    let R = matrix.rotateAroundX(angle);
    for (let [i, pt] of obj[0].entries()) {
        let a     = matrix.transpose([obj[0][i].concat([1])]);
        let b     = matrix.mult(R, a);
        obj[0][i] = matrix.transpose(b)[0].slice(0, 3);
    }
}

function rotate3DObjectAroundYAxis(obj, angle) {
    let R = matrix.rotateAroundY(angle);
    for (let [i, pt] of obj[0].entries()) {
        let a     = matrix.transpose([obj[0][i].concat([1])]);
        let b     = matrix.mult(R, a);
        obj[0][i] = matrix.transpose(b)[0].slice(0, 3);
    }
}

function rotate3DObjectAroundZAxis(obj, angle) {
    let R = matrix.rotateAroundZ(angle);
    for (let [i, pt] of obj[0].entries()) {
        let a     = matrix.transpose([obj[0][i].concat([1])]);
        let b     = matrix.mult(R, a);
        obj[0][i] = matrix.transpose(b)[0].slice(0, 3);
    }
}

function style3DObject(obj, faceStyle) {
    obj[2].forEach(face => Object.assign(face, {style: faceStyle}));
}

function printObjectExtents(obj) {
    let pts = obj[0];
    let mins = [ Infinity,  Infinity,  Infinity];
    let maxs = [-Infinity, -Infinity, -Infinity];
    for (let pt of pts) {
        for (let i = 0; i < 3; i++) {
            mins[i] = Math.min(mins[i], pt[i]);
            maxs[i] = Math.max(maxs[i], pt[i]);
        }
    }
    console.log(
        `The xyz extents are:` +
        ` [${mins[0]}, ${maxs[0]}]` +
        ` [${mins[1]}, ${maxs[1]}]` +
        ` [${mins[2]}, ${maxs[2]}]`
    );
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

                // Push the z faces.
                // These are faces perpendicular to the z axis.
                // (There's only one z face.)
                if (z === 0 && x !== 0 && y !== 0) {
                    util.push(faceMap, `z:_:_:_`, idx);
                }
                // Push the x faces.
                if (x !== 0) {
                    for (let yy = y; yy >= y - 1; yy--) {
                        if (-1 <= yy && yy <= 0) {
                          util.push(faceMap, `x:${x}:${yy}:`, idx);
                        }
                    }
                }
                // Push the y faces.
                if (y !== 0) {
                    for (let xx = x; xx >= x - 1; xx--) {
                        if (-1 <= xx && xx <= 0) {
                          util.push(faceMap, `y:${xx}:${y}:`, idx);
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
        face.style = {fill: '#a44'};
    }

    let dbgMode = false;
    if (dbgMode) space.ctx.doDrawDots = true;

    let obj = [pts, lines, faces];
    // obj = [pts, lines.slice(0, 21), []];  // DEBUG2

    // Add a small degree of fading for the farther-back points and lines.
    // space.ctx.fadeRange = [8, 10];

    space.ctx.zoom = 2;

    // TODO2:Don't mess with input values, but rather copy them into space.js.
    //       The immediate reason is that I can't clone objects that include svg
    //       elements as descendents. Bigger-picture, it seems just like a
    //       better practice to decouple user data from internal data.

    // TODO1:The current setup reveals a super-weird bug. I think it may have to
    //       do with normal vectors. Oh right, it won't get the order of
    //       vertices incorrect if the normal vector is zero.
    //       That must be it.
    //       So I want to fix object handling so that the origin does not need
    //       to be interior to the object before adding it.

    // The first box, `obj`, is in z=[-1, 0].
    // xyz = [-1, 1] [-1, 1] [-1 0]
    translate3DObject(obj, [0, 0, -1.0]);
    console.log('obj (red):');
    printObjectExtents(obj);

    // The gap strategy here is that:
    //  * An extent min of -1 is really at -1.
    //  * An extent min of  0 is really at  eps.
    //  * An extent min of  1 is really at  2 * eps.

    let gap = 0.001;

    // Unused.
    // This box is in z=[eps, 1 + eps].
    let obj2 = clone3DObject(obj);
    translate3DObject(obj2, [0, 0, 1 + gap]);
    style3DObject(obj2, {fill: '#4a4'});
    console.log('obj2:');
    printObjectExtents(obj2);

    // Unused.
    let obj3 = clone3DObject(obj);
    translate3DObject(obj3, [0, 0, 2 + 2 * gap]);
    style3DObject(obj3, {fill: '#44a'});
    console.log('obj3:');
    printObjectExtents(obj3);

    // This box is in x=[1 + 2 eps, 2 + 2 eps].
    // xyz = [1, 2] [0, 2] [-1, 1]
    let obj4 = clone3DObject(obj);
    rotate3DObjectAroundXAxis(obj4, -Math.PI / 2);
    rotate3DObjectAroundZAxis(obj4,  Math.PI / 2);
    translate3DObject(obj4, [1 + 2 * gap, 1 + gap, 0]);
    style3DObject(obj4, {fill: '#880'});
    console.log('obj4:');
    printObjectExtents(obj4);

    // This box is in y=[1 + eps, 2 + eps].
    // xyz = [-1, 1] [1, 2] [-1, 1]
    let obj5 = clone3DObject(obj);
    rotate3DObjectAroundXAxis(obj5, Math.PI / 2);
    rotate3DObjectAroundYAxis(obj5, -Math.PI / 2);
    translate3DObject(obj5, [0, 1 + 2 * gap, 0]);
    style3DObject(obj5, {fill: '#808'});
    console.log('obj5:');
    printObjectExtents(obj5);

    // This box is in y=[-1 - eps, -eps].
    // xyz = [0, 2] [-1, 0] [0, 2]
    let obj6 = clone3DObject(obj);
    rotate3DObjectAroundXAxis(obj6, -Math.PI / 2);
    translate3DObject(obj6, [1 + gap, 0, 1 + gap]);
    style3DObject(obj6, {fill: '#4a4'});
    console.log('obj6 (green):');
    printObjectExtents(obj6);

    // This box is in x=[-1 - eps, -eps].
    // xyz = [-1, 0] [-1, 1] [0, 2]
    let obj7 = clone3DObject(obj);
    rotate3DObjectAroundXAxis(obj7, Math.PI / 2);
    rotate3DObjectAroundZAxis(obj7, Math.PI / 2);
    translate3DObject(obj7, [0, 0, 1 + gap]);
    style3DObject(obj7, {fill: '#44a'});
    console.log('obj7 (blue):');
    printObjectExtents(obj7);

    let obj8 = clone3DObject(obj);
    rotate3DObjectAroundXAxis(obj8, Math.PI);
    translate3DObject(obj8, [1 + gap, 1 + gap, 1 + 2 * gap]);
    style3DObject(obj8, {fill: '#088'});
    console.log('obj8 (cyan):');
    printObjectExtents(obj8);

    space.addObject(obj);   // red
    // space.addObject(obj2);  // green, leave out
    // space.addObject(obj3);  // blue, leave out

    // XXX
    // In the code block below, the full image includes all the objects.
    // However, I could skip some of them in order to help me debug
    // z-order sorting.

    // space.addObject(obj4);  // yellow
    // space.addObject(obj5);  // magenta
    // space.addObject(obj6);  // green
    // space.addObject(obj7);  // blue
    // space.addObject(obj8);  // cyan

    if (dbgMode) {
        let offset = 15;
        let n = obj[0].length * 2;
        space.addLabels([...Array(n).keys()], offset);
    }

    space.setTransform(matrix.mult(
        matrix.translate([0, 0, 9]),
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
        // space.ctx.rotationsPerSec = 0.65;  // XXX DEBUG1
        // space.ctx.rotationsPerSec = 0.3;  // XXX DEBUG5
        space.makeDraggable();
        space.animate();
    }
});
