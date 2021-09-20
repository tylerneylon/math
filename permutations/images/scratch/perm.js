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

export let styleScale = 1.0;
export let edgeStyle = {
    stroke: '#ddd',
    fill: 'transparent',
    'stroke-width': 1.5 * styleScale
};
let textOutlineStyle = {
    stroke: 'white',
    fill: 'transparent',
    'stroke-width': 10 * styleScale,
    visibility: 'hidden',
    style: 'font-family: sans-serif'
}
let textStyle = {
    stroke: 'transparent',
    fill: '#ddd',
    'stroke-width': 10 * styleScale,
    visibility: 'hidden',
    style: 'font-family: sans-serif'
}
export let dotStyle = {
    stroke: 'transparent',
    fill:   '#888',
    r: 3 * styleScale
};

let mainHighlightColor = '#07f';
let edgeHighlightColor = '#37a';
let nborHighlightColor = '#00f';


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

    let outline = draw.circle(pt, outlineStyle, outlineGroup);
    let hitDot  = draw.circle(pt, outlineStyle, frontGroup);
    draw.addAttributes(hitDot, {fill: 'transparent'});
    let circle  = draw.circle(pt, dotStyle, frontGroup);
    return [outline, hitDot, circle];
}

// Ensure that elt[prop] exists; if not, create it as an empty array.
// Push newItem onto the end of that array.
function addToPropArray(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) {
        elt[prop] = [];
    }
    elt[prop].push(newItem);
}

function setLabelVisibility(pt, visibility) {
    for (let textElt of pt.textElts) {
        textElt.setAttribute('visibility', visibility);
    }
}

// This returns a handler that updates graph colors based on `colors`.
// This is designed for use in mouseover and mouseout events.
function getGraphColorer(ptMap, pt, colors) {
    let circle = pt.elt;
    return function () {
        circle.setAttribute('fill', colors.mainDotColor);
        setLabelVisibility(pt, colors.textVisibility);
        pt.textElts[1].setAttribute('fill', colors.labelColor);
        for (let edgeElt of pt.edgeElts) {
            let edgeGroup = edgeElt.parentElement;
            edgeElt.remove();
            edgeGroup.append(edgeElt);
            edgeElt.setAttribute('stroke', colors.edgeColor);
        }
        for (let edge of pt.edges) {
            let nborElt = ptMap[edge[2]].elt;
            nborElt.setAttribute('fill', colors.nborColor);
            setLabelVisibility(ptMap[edge[2]], colors.textVisibility);
        }
    };
}

// For each perm p in S_n (for the given n), call cb(perm_str), where
// perm_str is the string for perm'n p; eg "1432".
//
// This is algorithm L from Knuth's section 7.2.1.2.
// It provides all permutations in lexicographic order.
function forAllPermsLex(n, cb) {

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
        [perm[j], perm[k]] = [perm[k], perm[j]];

        // Reverse perm[j + 1] .. perm[n - 1].
        let newEnd = perm.slice(j + 1).reverse();
        perm = perm.slice(0, j + 1).concat(newEnd);
    }
}

// For each perm p in S_n (for the given n), call cb(perm_str), where
// perm_str is the string for perm'n p; eg "1432".
//
// This is algorithm P from Knuth's section 7.2.1.2, also known as the "plain
// changes" algorithm.
// It provides all permutations, always using a single transposition to go from
// one permutation to the next.
function forAllPermsPlain(n, cb) {

    console.assert(n >= 3, 'This permutation iterator assumes n >= 3.');

    let c    = Array(n).fill(0);
    let sign = Array(n).fill(1);

    let perm = [];
    for (let i = 1; i <= n; i++) {
        perm.push(i.toString());
    }

    while (true) {

        cb(perm.join(''));

        let j = n - 1;
        let s = 0;
        let q = 0;

        while (true) {
            q = c[j] + sign[j];
            if (q > j) {
                if (j === 1) return;
                s++;
            }
            if (0 <= q && q <= j) break;
            sign[j] *= -1;
            j--;
        }

        let [a, b] = [j - c[j] + s, j - q + s];  // We'll swap these indexes.
        [perm[a], perm[b]] = [perm[b], perm[a]];
        c[j] = q;
    }
}

// This is a Fisher-Yates shuffle; I got the code from here:
// https://stackoverflow.com/a/12646864/3561
function shuffleArray(array) {
    random.seed(3);
    for (let i = array.length - 1; i > 0; i--) {
        const j = random.int(i + 1);  // An int in the range [0, i].
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// For each perm p in S_n (for the given n), call cb(perm_str), where
// perm_str is the string for perm'n p; eg "1432".
//
// This uses algorithm P (plain changes) behind the scenes, and then applies a
// shuffle.
function forAllPermsRandom(n, cb) {

    console.assert(n >= 3, 'This permutation iterator assumes n >= 3.');

    let perms = [];
    forAllPermsPlain(n, function (perm) { perms.push(perm); });
    shuffleArray(perms);

    for (let perm of perms) cb(perm);
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
    forAllPermsLex(n, function (perm_str) {
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

function drawGraphWithPtMap(ptMap, n) {
    // Add 'edges' to each point value in ptMap. Each `edges` value is a list of
    // [from, to, dest]; each of `from` and `to` is an {x, y} point. `dest` is
    // the permutation string of the other side of the edge.
    // The returned array `edges` is an array of
    // [fromPt, toPt, fromPerm, toPerm] values without redundancy.
    let edges = addPtMapEdges(n, ptMap);

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
        pt.textElts = [
            draw.text(leftBaseline, perm, textOutlineStyle, outlineGroup),
            draw.text(leftBaseline, perm, textStyle, frontGroup)
        ];
    }
    // Draw the points.
    let highlightColors = {
        mainDotColor: mainHighlightColor,
        labelColor:   mainHighlightColor,
        edgeColor:    edgeHighlightColor,
        nborColor:    nborHighlightColor,
        textVisibility: 'visible'
    };
    let unhighlightColors = {
        mainDotColor: dotStyle.fill,
        labelColor:   textStyle.fill,
        edgeColor:    edgeStyle.stroke,
        nborColor:    dotStyle.fill,
        textVisibility: 'hidden'
    };
    for (const [perm, pt] of Object.entries(ptMap)) {
        let [outline, hitDot, circle] = addDot(pt, outlineGroup, frontGroup);
        pt.elt = circle;

        let highlighter = getGraphColorer(ptMap, pt, highlightColors);
        let unhighlighter = getGraphColorer(ptMap, pt, unhighlightColors);
        for (let elt of [hitDot, circle]) {
            elt.addEventListener('mouseover', highlighter);
            elt.addEventListener('mouseout', unhighlighter);
        }
    }

}

// Convert a permutation string like "21453" into a cycle string like
// "(12)(345)".
export function getCycleStr(permStr) {
    // Permutations are historically 1-indexed (their first element is 1), so I
    // will ignore index 0 for the arrays in this function.
    let perm = ('0' + permStr).split('').map(x => parseInt(x));
    let n = permStr.length;
    let cycles = [];
    let isDone = Array(n + 1).fill(false);
    for (let i = 1; i <= n; i++) {
        if (isDone[i]) continue;
        let cycle = [i];
        let j = i;
        while (true) {
            isDone[j] = true;
            if (perm[j] === cycle[0]) {
                if (cycle.length > 1) cycles.push(cycle);
                break;
            } else {
                cycle.push(perm[j]);
                j = perm[j];
            }
        }
    }
    let s = cycles.map(c => `(${c.join('')})`).join('');
    if (s === '') s = 'e';  // Treat the identity as a special case.
    return s;
}

function factorial(n) {
    let value = 1;
    for (let i = 2; i <= n; i++) value *= i;
    return value;
}

// Render G_n in the rectangle from [-a,-b] to [a, b].
export function drawBipartiteGn(n, useLexOrdering) {

    if (useLexOrdering === undefined) {
        useLexOrdering = false;
    }
    let forAllPerms = useLexOrdering ? forAllPermsLex : forAllPermsPlain;

    // Set the size of the subsquare we use for rendering.
    let a = 0.5;
    let b = 0.8;

    // Determine the number of points per column.
    let k = factorial(n) / 2;

    let ptMap = {};
    let [x, y] = [-a, -b];
    let dy = 2 * b / (k - 1);
    forAllPerms(n, function (permStr) {
        ptMap[permStr] = {x, y};
        x *= -1;
        if (x < 0) y += dy;
    });
    drawGraphWithPtMap(ptMap, n);
}

export function drawRandomGn(n) {
    // Come up with a map from strings like "1432" to an {x, y} point in the
    // unit circle around the origin.
    let ptMap = makeRandomPtMap(n);
    drawGraphWithPtMap(ptMap, n);
}

export function drawCircularGn(n, orderingType) {

    let radius = 0.8;

    if (orderingType === undefined) {
        orderingType = 'plain';
    }

    let forAllPerms = null;
    if (orderingType === 'plain') {
        forAllPerms = forAllPermsPlain;
    } else if (orderingType === 'lex') {
        forAllPerms = forAllPermsLex;
    } else if (orderingType === 'random') {
        forAllPerms = forAllPermsRandom;
    }

    let numPts = factorial(n);
    let angleDelta = 2 * Math.PI / numPts;
    let ptMap = {};
    let angle = 0.0;
    forAllPerms(n, function (permStr) {
        ptMap[permStr] = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
        angle += angleDelta;
    });

    drawGraphWithPtMap(ptMap, n);
}

