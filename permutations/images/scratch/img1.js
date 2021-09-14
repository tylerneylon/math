/* img1.js
 *
 * Draw G_3 using random points in a circle.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as random from './random.js';


// ______________________________________________________________________
// Globals and constants

var xSize = 1000, ySize = 1000;

var xMid = xSize / 2;
var yMid = ySize / 2;
var canvasSize = Math.min(xSize, ySize);
// If we multiply logical units * toCanvasScale, then we map from [-1, 1]^2
// into a square that just fits, centered, in the canvas.
var toCanvasScale = canvasSize / 2.0;

var styleScale = 1.0;
var edgeStyle = {
    stroke: '#aaa',
    fill: 'transparent',
    'stroke-width': 1.5 * styleScale
};


// ______________________________________________________________________
// Begin G_n specific code.
//
// A permutation string is a string of the form "1432".
// I'm assuming the max n I'll work with in practice is 9.
// A transposition string is of the form "t34", meaning to swap 3 and 4.
// I include the t to help with debugging; it makes the string's intended
// meaning more immediately obvious to mere humans.

function addDot(pt) {

    let outlineStyle = {
        stroke: 'transparent',
        fill:   'white',
        r: 7 * styleScale
    };

    let dotStyle = {
        stroke: 'transparent',
        fill:   '#888',
        r: 3 * styleScale
    };

    draw.circle(pt, outlineStyle);
    return draw.circle(pt, dotStyle);
}

// For each perm p in S_n (for the given n), call cb(perm_str), where
// perm_str is the string for perm'n p; eg "1432".
//
// This is algorithm L from Knuth's section 7.2.1.2.
// It provides all permutations in lexicographic order.
function forAllPerms(n, cb) {

    console.assert(n >= 3, 'This permutation iterator assumes n >= 3.');

    let perm = [];
    for (let i = 1; i <= n; i++) {
        perm.push(i.toString());
    }

    while (true) {

        cb(perm.join(''));

        // Find the rightmost j with perm[j] < perm[j + 1].
        let j = n - 2;
        while (j >= 0 && perm[j] > perm[j + 1]) j--;
        if (j == -1) return;

        // Find the rightmost k with perm[k] > perm[j].
        let k = n - 1;
        while (perm[k] < perm[j]) k--;

        // Swap perm[j] and perm[k]. This makes perm[j] a tiny bit bigger.
        let tmp = perm[j];
        perm[j] = perm[k];
        perm[k] = tmp;

        // Reverse perm[j + 1] .. perm[n - 1].
        let newEnd = perm.slice(j + 1).reverse();
        perm = perm.slice(0, j + 1).concat(newEnd);
    }
}

// For each transposition t in S_n, call cb(t). Each t is denoted as a
// string starting with "t", such as "t23".
function forAllTranspositions(n, cb) {
    for (let i = 1; i < n; i++) {
        for (let j = i + 1; j <= n; j++) {
            cb("t" + i + j);
        }
    }
}

function applyTransposition(perm, t) {
    return perm.replace(t[1], '_').replace(t[2], t[1]).replace('_', t[2]);
}

function makeRandomPtMap(n) {
    var ptMap = {};
    forAllPerms(n, function (perm_str) {
        ptMap[perm_str] = random.ptInCircle();
    });
    return ptMap;
}

function findPtMapEdges(n, ptMap) {
    var edges = [];
    forAllTranspositions(n, function(t) {
        for (let p1 of Object.keys(ptMap)) {
            let p2 = applyTransposition(p1, t);
            if (p1 < p2) {
                let from = ptMap[p1];
                let to   = ptMap[p2];
                edges.push([from, to]);
            }
        }
    });
    return edges;
}

function drawGn(n) {

    // Come up with a map from strings like "1432" to an {x, y} point in the
    // unit circle around the origin.
    let ptMap = makeRandomPtMap(n);

    // Find a list of edges to render. Each edge is a [from, to] array and 
    // `edges` is an array of such edges. (`from` and `to` are {x, y} pts.)
    let edges = findPtMapEdges(n, ptMap);

    // Draw the edges.
    for (let edge of edges) {
        let line = draw.line(edge[0], edge[1], edgeStyle);
    }
    // Draw the points.
    for (let pt of Object.values(ptMap)) {
        addDot(pt);
    }
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    // Set up graphic components.
    const svg = document.getElementById('svg');
    draw.addAttributes(svg, {width: xSize, height: ySize});
    draw.setSVG(svg);
    draw.drawInFront();
    draw.setOrigin({x: xSize / 2, y: ySize / 2});
    draw.setScale(toCanvasScale);

    // Set a deterministic seed so the image is reproducible.
    random.seed(6);

    // For debugging: Draw the unit circle's circumference.
    var lightStyle = {
        stroke: '#f4f4f4',
        fill: 'transparent',
        'stroke-width': 2
    };
    draw.circle({x: 0, y: 0}, 1, lightStyle);

    // Draw G_3.
    drawGn(3);
});
