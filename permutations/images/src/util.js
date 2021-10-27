/* util.js
 *
 * Miscellaneous functions that are used more than once.
 *
 */

import * as matrix from './matrix.js';

// ______________________________________________________________________
// Public functions

// Ensure that elt[prop] exists; if not, create it as an empty array.
// Push newItem onto the end of that array.
export function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

// Return [pts, lines, faces] of a cube centered at the origin with vertices in
// {-1, 1}^3.
export function getCubePtsLinesFaces() {

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

// This expects `pts` to be a list of xyz arrays, and labels to be a
// corresponding list of strings. Conceptually, this scans from left to right --
// meaning from low x values to high x values -- and transforms each slice of
// the input points into a projection in 2d. Low x values correspond to small
// radii, while high x values to large.
//
// If both aMin and aMax are provided, then the points are rotated by an angle
// `a` that increases from aMin to aMax as x proceeds from xMin to xMax.
export function explode3DPoints(pts, labels, rMin, rMax, aMin, aMax) {
    let p = pts.slice();  // Make a copy so we can re-order.
    p.forEach((x, i) => x.label = labels[i]);

    // Sort the points with increasing x values.
    p.sort((a, b) => a[0] - b[0]);

    let [xMin, xMax] = [p[0][0], p[p.length - 1][0]];
    let findR = x => rMin + (rMax - rMin) * (x - xMin) / (xMax - xMin);
    let findA = x => aMin + (aMax - aMin) * (x - xMin) / (xMax - xMin);

    let newP = [];
    for (let pt of p) {
        let len = Math.sqrt(pt[1] * pt[1] + pt[2] * pt[2]);
        let r = findR(pt[0]);
        let newPt = [pt[1] / len * r, pt[2] / len * r];
        if (aMin !== undefined && aMax !== undefined) {
            let a = findA(pt[0]);
            newPt = matrix.transpose(matrix.mult(
                matrix.rotateXY(a),
                matrix.transpose([newPt])
            ))[0];
        }
        newPt.label = pt.label;
        newP.push(newPt);
    }
    return newP;
}

// Derive an [r, g, b] array from a color string. The values of r, g, and b are
// each in the range [0, 1]. This expects that the color string has no alpha
// value.
export function getStdColor(colorStr) {
    console.assert(colorStr[0] === '#');
    let color = [];
    let nDigits = (colorStr.length === 7 ? 2 : 1);
    for (let i = 0; i < 3; i++) {
        let channelStr = colorStr.substr(1 + nDigits * i, nDigits);
        if (nDigits === 1) channelStr = channelStr + channelStr;
        color.push(parseInt(channelStr, 16) / 255);
    }
    return color;
}

// This converts a standard color array to a color string. A standard color
// array has [r, g, b] which each value in the range [0, 1].
export function getColorStr(c) {
    const hex = d => Math.ceil(d * 255).toString(16).padStart(2, '0')
    return '#' + c.map(hex).join('');
}
