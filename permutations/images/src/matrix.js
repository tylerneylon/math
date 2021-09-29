/* matrix.js
 *
 * Functions to work with matrices.
 *
 * A matrix is an array of arrays, with each inner array being a row.
 * I decided to use this format because:
 * (a) then the notation m[i][j] is closer to math notation,
 * (b) I think it's more intuitive than column-major for most humans, and
 * (c) it is the default format for numpy, so easier to think about for
 *     numpy-folks. (This is also true for some other libraries.)
 *
 */


// ______________________________________________________________________
// Imports

import * as random from './random.js';


// ______________________________________________________________________
// Public functions.

export function mult(A, B) {

    // A is m x n. B is n x p.

    let m = A.length;
    let n = A[0].length;
    let p = B[0].length;

    console.assert(n === B.length, 'Matrix dimensions must match.');

    let C = Array(m);
    for (let i = 0; i < m; i++) { C[i] = Array(p); }

    for (let i = 0; i < m; i++) {
        for (let k = 0; k < p; k++) {
            let sum = 0;
            for (let j = 0; j < n; j++) sum += A[i][j] * B[j][k];
            C[i][k] = sum;
        }
    }

    return C;
}

// Return a human-friendly string for matrix A.
// `precision` is an integer specifying the number of digits to show after the
// decimal point. If not provided, `precision` is treated as 2.
export function stringify(A, precision) {

    if (precision === undefined) {
        precision = 2;
    }

    // Derive a matrix of strings.
    let Astr = [];
    for (let row of A) {
        Astr.push(row.map(x => x.toFixed(precision)));
    }

    // Determine the max width per column.
    let getLen = x => typeof x === 'string' ? x.length : x;
    let colWidths = Astr.reduce(
        (r1, r2) => r1.map((elt, i) => Math.max(getLen(elt), r2[i].length))
    );

    // Pad each number string to the appropriate widths and join.
    let sArr = [];  // This will be an array of lines to join.
    for (let i = 0; i < Astr.length; i++) {
        let row = Astr[i].map((elt, j) => elt.padStart(colWidths[j], ' '));
        sArr.push(row.join(' '));
    }

    return sArr.join('\n');
}

// Return the n x n identity matrix.
export function eye(n) {
    let A = Array(n);
    for (let i = 0; i < n; i++) {
        A[i] = Array(n).fill(0);
        A[i][i] = 1;
    }
    return A;
}

// This is a convenience function.
export function pr(A) {
    console.log(stringify(A));
}

// Returns A^(i) as a column vector.
// Columns are 0-indexed.
export function getColumn(A, i) {
    let col = [];
    for (let j = 0; j < A.length; j++) col.push([A[j][i]]);
    return col;
}

// Return an m x n matrix with random normal values.
// This uses the `random` library so that values can be
// reproduced deterministically.
export function rand(m, n) {
    let A = Array(m);
    for (let i = 0; i < m; i++) {
        A[i] = Array(n);
        for (let j = 0; j < n; j++) {
            A[i][j] = random.normal();
        }
    }
    return A;
}

// Return a new matrix which is the transpose of A.
export function transpose(A) {
    let [m, n] = [A.length, A[0].length];  // A is m x n.
    let At = Array(n);
    for (let i = 0; i < n; i++) {
        At[i] = Array(m);
        for (let j = 0; j < m; j++) {
            At[i][j] = A[j][i];
        }
    }
    return At;
}

// Calculate and return matrices Q, R so that Q is unitary and R
// is upper-right triangular.
export function qr(A) {
}

export function rotateAroundX(angle) {
    let A = eye(4);
    let [c, s] = [Math.cos(angle), Math.sin(angle)];
    A[1][1] =  c;
    A[1][2] = -s;
    A[2][1] =  s;
    A[2][2] =  c;
    return A;
}

export function rotateAroundY(angle) {
    let A = eye(4);
    let [c, s] = [Math.cos(angle), Math.sin(angle)];
    A[0][0] =  c;
    A[0][2] = -s;
    A[2][0] =  s;
    A[2][2] =  c;
    return A;
}

export function rotateAroundZ(angle) {
    let A = eye(4);
    let [c, s] = [Math.cos(angle), Math.sin(angle)];
    A[0][0] =  c;
    A[0][1] = -s;
    A[1][0] =  s;
    A[1][1] =  c;
    return A;
}