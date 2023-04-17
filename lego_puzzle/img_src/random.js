/* random.js
 *
 * A module to provide pseudorandom numbers.
 *
 * This comes in handy because js's Math.random() does not support the setting
 * of a seed - and sometimes we want fully deterministic behavior that appears
 * to be random, eg, for testing.
 *
 * I found the core of the algorithm here:
 * https://stackoverflow.com/a/19301306/3561
 *
 */


// ______________________________________________________________________
// Internal globals.

var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;


// ______________________________________________________________________
// Public interface.

// This takes any integer.
export function seed(i) {
    m_w = i;
    m_z = 987654321;
}

// This returns number between 0 (inclusive) and 1 (exclusive),
// just like Math.random().
export function real() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
}

export function int(belowThis) {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + m_w) & mask;
    result = result % belowThis;
    return result >= 0 ? result : result + belowThis;
}

export function normal() {
    // We'll use the Box-Muller transform and throw away (!) one
    // of the values. Hey, it's practical. See:
    // https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
    let u1 = real();
    let u2 = real();
    let theta = 2 * Math.PI * u2;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(theta);
    // We're effectively throwing away the sin variant of the above.
}

export function ptInCircle(radius = 1) {
    var x = radius, y = radius
    while (x * x + y * y > radius * radius) {
        x = radius * (real() * 2 - 1)
        y = radius * (real() * 2 - 1)
    }
    return {x, y}
}

