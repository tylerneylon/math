/* vector.js
 *
 * Functions to work with vectors.
 * For this library, a vector is any array with numeric values.
 *
 */


// ______________________________________________________________________
// Public functions

export function add(a, b) {
    return a.map((x, i) => x + b[i]);
}

export function sub(a, b) {
    return a.map((x, i) => x - b[i]);
}

export function midpoint(a, b) {
    return a.map((x, i) => (x + b[i]) / 2);
}

export function scale(a, s) {
    return a.map(x => x * s);
}

export function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

export function unit(v) {
    // Len = ||v||_2.
    let len = Math.sqrt(v.map(x => x * x).reduce((a, b) => a + b));
    return v.map(x => x / len);
}

export function dot(a, b) {
    return a.map((x, i) => x * b[i]).reduce((x, y) => x + y);
}
