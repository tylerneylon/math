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
// Internal functions.

export function mult2(A, B) {

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


// ______________________________________________________________________
// Public functions.

export function mult(...args) {
    return args.reduce(mult2);
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
    let lenArray = Astr.map(row => row.map(x => x.length));
    let colWidths = lenArray.reduce(
        (r1, r2) => r1.map((elt, i) => Math.max(elt, r2[i]))
    );

    // Pad each number string to the appropriate widths and join.
    let sArr = [];  // This will be an array of lines to join.
    for (let i = 0; i < Astr.length; i++) {
        let row = Astr[i].map((elt, j) => elt.padStart(colWidths[j], ' '));
        sArr.push(row.join(' '));
    }

    return sArr.join('\n');
}

// Return a deep copy of matrix A.
export function copy(A) {
    let [m, n] = [A.length, A[0].length];
    let B = Array(m);
    for (let i = 0; i < m; i++) {
        B[i] = Array(n);
        for (let j = 0; j < n; j++) {
            B[i][j] = A[i][j];
        }
    }
    return B;
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
export function pr(A, precision) {
    console.log(stringify(A, precision));
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
// For now I'm assuming A is square. In the future I may ease up
// that assumption.
export function qr(A) {

    console.assert(A.length === A[0].length, 'I expected a square matrix!');
    let n = A.length;

    // It's a bit simpler to work with rows, so we'll start with A^T,
    // transform that into Q^T, and then return Q at the end.
    let Qt = transpose(A);
    let R  = eye(n);

    for (let i = 0; i < n; i++) {
        let m = Math.sqrt(Qt[i].map(x => x**2).reduce((a, b) => a + b));
        R[i][i] = m;
        Qt[i] = Qt[i].map(x => x / m);
        for (let j = i + 1; j < n; j++) {
            R[i][j] = mult([Qt[i]], transpose([Qt[j]]))[0][0];
            Qt[j] = Qt[j].map((x, k) => x - R[i][j] * Qt[i][k]);
        }
    }

    return [transpose(Qt), R];
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


// ______________________________________________________________________
// Tests

function isclose(a, b) {
    return Math.abs(a - b) < 0.0001;
}

export function test() {

    // We'll check the QR decomposition of a random matrix.
    let A = rand(4, 4);

    let [Q, R] = qr(A);

    // Check that Q*R = A.
    let QR = mult(Q, R);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            console.assert(isclose(QR[i][j], A[i][j]));
        }
    }

    // Check that Q is unitary.
    let QtQ = mult(transpose(Q), Q);
    let I   = eye(4);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            console.assert(isclose(QtQ[i][j], I[i][j]));
        }
    }

    // Check that R is upper-right.
    for (let i = 1; i < 4; i++) {
        for (let j = 0; j < i; j++) {
            console.assert(R[i][j] === 0);
        }
    }
}
