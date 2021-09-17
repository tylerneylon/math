/* perm.js
 *
 * Functions to work with permutations.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as random from './random.js';


// ______________________________________________________________________
// Globals and constants

var styleScale = 1.0;
var edgeStyle = {
    stroke: '#aaa',
    fill: 'transparent',
    'stroke-width': 1.5 * styleScale
};
var textOutlineStyle = {
    stroke: 'white',
    fill: 'transparent',
    'stroke-width': 10 * styleScale,
    visibility: 'hidden',
    style: {'font-family': 'sans-serif'}
}
var textStyle = {
    stroke: 'transparent',
    fill: '#777',
    'stroke-width': 10 * styleScale,
    visibility: 'hidden',
    style: {'font-family': 'sans-serif'}
}
let dotStyle = {
    stroke: 'transparent',
    fill:   '#888',
    r: 3 * styleScale
};


var mainHighlightColor = '#00f';
var edgeHighlightColor = '#44a';
var nborHighlightColor = '#559';


// ______________________________________________________________________
// Begin G_n specific code.
//
// A permutation string is a string of the form "1432".
// I'm assuming the max n I'll work with in practice is 9.
// A transposition string is of the form "t34", meaning to swap 3 and 4.
// I include the t to help with debugging; it makes the string's intended
// meaning more immediately obvious to mere humans.

function addDot(pt, outlineGroup, frontGroup) {

    let outlineStyle = {
        stroke: 'transparent',
        fill:   'white',
        r: 7 * styleScale
    };

    draw.circle(pt, outlineStyle, outlineGroup);
    return draw.circle(pt, dotStyle, frontGroup);
}

function addToPropArray(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) {
        elt[prop] = [];
    }
    elt[prop].push(newItem);
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

function addPtMapEdges(n, ptMap) {
    var edges = [];
    forAllTranspositions(n, function(t) {
        for (let p1 of Object.keys(ptMap)) {
            let p2 = applyTransposition(p1, t);
            // TODO Do I actually use this `edges` array?
            addToPropArray(ptMap[p1], 'edges', [ptMap[p1], ptMap[p2], p2]);
            if (p1 < p2) {
                let from = ptMap[p1];
                let to   = ptMap[p2];
                edges.push([from, to, p1, p2]);
            }
        }
    });
    return edges;
}

export function drawRandomGn(n) {

    // XXX
    //
    // Plan:
    // 
    // * Associate with each dot (foreground circle) the list of adjacent edges
    //   as well as the list of neighboring points.
    // * On mouseover, highlight this point, nbors, adjacent edges, and show
    //   labels for all these points.
    //

    // Come up with a map from strings like "1432" to an {x, y} point in the
    // unit circle around the origin.
    let ptMap = makeRandomPtMap(n);

    // Add 'edges' to each point value in ptMap. Each `edges` value is a list of
    // [from, to, dest]; each of `from` and `to` is an {x, y} point. `dest` is
    // the permutation string of the other side of the edge.
    // The returned array `edges` is an array of
    // [fromPt, toPt, fromPerm, toPerm] values without redundancy.
    let edges = addPtMapEdges(n, ptMap);

    // XXX
    if (false) {
        console.log('\n');
        console.log('edges:');
        console.log(edges);

        console.log('\n');
        console.log('ptMap:');
        console.log(ptMap);
    }

    // Prepare the group elements.
    let edgeGroup    = draw.add('g');
    let outlineGroup = draw.add('g');
    let frontGroup   = draw.add('g');

    // Draw the edges.
    for (let edge of edges) {
        let line = draw.line(edge[0], edge[1], edgeStyle, edgeGroup);
        addToPropArray(ptMap[edge[2]], 'edgeElts', line);
        addToPropArray(ptMap[edge[3]], 'edgeElts', line);
    }
    if (false) {
        for (const [perm, pt] of Object.entries(ptMap)) {

        }
    }
    // Draw point labels.
    for (const [perm, pt] of Object.entries(ptMap)) {
        let eps = 0.01
        let leftBaseline = draw.translate(pt, {x: eps, y: -eps});
        pt.textElts = [];
        pt.textElts.push(
            draw.text(leftBaseline, perm, textOutlineStyle, outlineGroup)
        );
        pt.textElts.push(
            draw.text(leftBaseline, perm, textStyle, frontGroup)
        );
    }
    // Draw the points.
    for (const [perm, pt] of Object.entries(ptMap)) {
        let circle = addDot(pt, outlineGroup, frontGroup);
        circle.addEventListener('mouseover', function (event) {
            circle.setAttribute('fill', mainHighlightColor);
            for (let textElt of pt.textElts) {
                textElt.setAttribute('visibility', 'visible');
            }
            pt.textElts[1].setAttribute('fill', mainHighlightColor);
            for (let edgeElt of pt.edgeElts) {
                edgeElt.setAttribute('stroke', edgeHighlightColor);
            }
        });
        circle.addEventListener('mouseout', function (event) {
            circle.setAttribute('fill', dotStyle.fill);
            for (let textElt of pt.textElts) {
                textElt.setAttribute('visibility', 'hidden');
            }
            for (let edgeElt of pt.edgeElts) {
                edgeElt.setAttribute('stroke', edgeStyle.stroke);
            }
        });
    }
}

