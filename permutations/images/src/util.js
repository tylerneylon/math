/* util.js
 *
 * Miscellaneous functions that are used more than once.
 *
 */


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
export function explode3DPoints(pts, labels) {
    let p = pts.slice();  // Make a copy so we can re-order.
    p.forEach((x, i) => x.label = labels[i]);

    // Sort the points with increasing x values.
    p.sort((a, b) => a[0] - b[0]);

    console.log(p);
}
