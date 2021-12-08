/* perm2.js
 *
 * Functions to work with permutations.
 *
 * XXX Eventually this will replace perm.js.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw2  from './draw2.js';
import * as matrix from './matrix.js';
import * as random from './random.js';
import * as util   from './util.js';


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
export let outlineStyle = {
    stroke: 'transparent',
    fill:   'white',
    r: 6 * styleScale
};

export let renderCtx = {
    // edgeWeighting can be 'default', 'boldNearE', or 'recursive'.
    edgeWeighting: 'default',
    // labelStyle can be 'all' or 'mainOnly'
    labelStyle: 'all'
};

let mainHighlightColor = '#07f';
let edgeHighlightColor = '#1ac';
let nborHighlightColor = '#00f';


// ______________________________________________________________________
// Internal utility functions

function factorial(n) {
    let value = 1;
    for (let i = 2; i <= n; i++) value *= i;
    return value;
}

// Given the number of small circles we want to fit inside a unit circle
// (and in a ring just inside the circumference), this returns the radius
// of each smaller circle.
function findSmallRadius(n) {
    return 1 / (1 + 1 / Math.sin(Math.PI / n))
}

// Call cb(pt) for n points distributed evenly around the circumference of the
// given circle. A circle is a {cx, cy, r} object.
function forCirclePts(circle, n, angle, cb) {
    for (let i = 0; i < n; i++) {
        let x = circle.cx + circle.r * Math.cos(angle);
        let y = circle.cy + circle.r * Math.sin(angle);
        cb({x, y});
        angle += 2 * Math.PI / n;
    }
}


// ______________________________________________________________________
// Internal G_n specific code
//
// A permutation string is a string of the form "1432".
// I'm assuming the max n I'll work with in practice is 9.
// A transposition string is of the form "t34", meaning to swap 3 and 4.
// I include the t to help with debugging; it makes the string's intended
// meaning more immediately obvious to mere humans.

function getPermIterator(orderingType) {
    if (orderingType === undefined) return forAllPermsPlain;
    if (orderingType === 'plain')   return forAllPermsPlain;
    if (orderingType === 'lex')     return forAllPermsLex;
    if (orderingType === 'random')  return forAllPermsRandom;
}

// This returns a ptMap of G_n within the given circle.
function placeRecursivePtsInCircle(n, circle, orderingType, angle) {

    console.assert(n >= 3, 'placeRecursivePtsInCircle assumes n >= 3.');

    if (angle === undefined) angle = 0;

    let forAllPerms = getPermIterator(orderingType);
    let ptMap = {};

    if (n === 3) {
        let perms = [];
        forAllPerms(n, function (permStr) { perms.push(permStr); });

        let nPts = 6;
        let i = 0;
        forCirclePts(circle, nPts, angle, function (pt) {
            ptMap[perms[i]] = pt;
            i++;
        });
        return ptMap;
    }

    // Handle the case n > 3 recursively.
    let r = circle.r * findSmallRadius(n + 3);
    let R = circle.r - r;
    let i = 1;

    forCirclePts(
            {cx: circle.cx, cy: circle.cy, r: R},
            n,
            angle,
            function (center) {

        let smallCircle = {cx: center.x, cy: center.y, r};
        let angle = 0;
        if (n === 4) angle = 2 * Math.PI / 3 * (i - 1);
        let circlePtMap = placeRecursivePtsInCircle(
            n - 1,
            smallCircle,
            orderingType,
            angle
        );

        for (let permStr in circlePtMap) {
            let p = null;
            if (false) {
                p = n.toString() + permStr;
                p = applyTransposition(p, 't' + n + i);
            } else {
                p = permStr.split('');
                for (let j = 0; j < p.length; j++) {
                    let elt = parseInt(p[j]);
                    if (elt >= i) p[j] = elt + 1;
                }
                p = i.toString() + p.join('');
            }

            ptMap[p] = circlePtMap[permStr];
        }
        i++;
    });
    return ptMap;
}

function addDot(artist, pt, outlineGroup, frontGroup, excludeHitDot) {

    let thisDotStyle = Object.assign({}, dotStyle);
    if (pt.hasOwnProperty('maxUnitRadius')) {
        let maxCanvasRadius = pt.maxUnitRadius * artist.toCanvasScale;
        thisDotStyle.r = Math.min(maxCanvasRadius, thisDotStyle.r);
    }
    let outline = artist.addCircle(pt, outlineStyle, outlineGroup);
    let hitDot  = null;
    if (!excludeHitDot) {
        hitDot = artist.addCircle(pt, outlineStyle, frontGroup);
        draw2.addAttributes(hitDot, {fill: 'transparent'});
    }
    let circle = artist.addCircle(pt, thisDotStyle, frontGroup);
    return [outline, hitDot, circle];
}

// Ensure that elt[prop] exists; if not, create it as an empty array.
// Push newItem onto the end of that array.
function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

function set(elt, prop, key, value) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = {};
    elt[prop][key] = value;
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
        circle.coreFill = util.getStdColor(colors.mainDotColor);
        setLabelVisibility(pt, colors.textVisibility);
        pt.textElts[1].setAttribute('fill', colors.labelColor);
        for (let edgeElt of pt.edgeElts) {
            let edgeGroup = edgeElt.parentElement;
            edgeElt.remove();
            edgeGroup.append(edgeElt);
            if (colors.textVisibility === 'visible') {
                edgeElt.setAttribute('stroke', colors.edgeColor);
            } else {
                edgeElt.setAttribute('stroke', edgeElt.baseColor);
            }
        }
        for (let edge of pt.edges) {
            let nborElt = ptMap[edge.dest].elt;
            nborElt.setAttribute('fill', colors.nborColor);
            nborElt.coreFill = util.getStdColor(colors.nborColor);
            if (renderCtx.labelStyle === 'all') {
                setLabelVisibility(ptMap[edge.dest], colors.textVisibility);
            }
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

function getCommonPrefixLen(s1, s2) {
    let i = 0;
    while (i <= s1.length && s1[i] === s2[i]) i++;
    return i;
}

function addPtMapEdges(n, ptMap) {
    var edges = [];
    forAllTranspositions(n, function(t) {
        for (let p1 of Object.keys(ptMap)) {
            let p2 = applyTransposition(p1, t);
            push(
                ptMap[p1],
                'edges',
                {from: ptMap[p1], to: ptMap[p2], dest: p2}
            );
            if (p1 < p2) {
                let from = ptMap[p1];
                let to   = ptMap[p2];
                let edge = {from, to, p1, p2};
                if (renderCtx.edgeWeighting === 'boldNearE') {
                    let minM = Math.min(getMagnitude(p1), getMagnitude(p2));
                    if (minM === 0) edge.weightScale = 10.0;
                    if (minM === 1) edge.weightScale =  5.0;
                }
                if (renderCtx.edgeWeighting === 'recursive') {
                    // k is in the range [0, n-2].
                    // Edges with higher k values are more bold.
                    let k = getCommonPrefixLen(p1, p2);
                    edge.weightScale = 1.6 ** k;
                    edge.strokeScale = 1.6 ** -k;
                    edge.groupNum = k;
                }
                edges.push(edge);
            }
        }
    });
    return edges;
}


// ______________________________________________________________________
// Public functions

// This accepts a point map ptMap, the n for which G_n we're working with,
// and optionally a list of line styles edgeStyles. It draws G_n in 2d based on
// the (x, y) coordinates specified for each permutation in ptMap.
// If `excludeHitDots` is given, it controls whether or not hit dots are
// created. The default is to include hit dots.
//
// This returns [pts, ptElts, lines].
//     `pts` is an array of xy arrays, one for each node in the rendered graph.
//     `ptElts` is an array of {dot, outline, textElts}, one for each point.
//         A dot is a colorful svg circle.
//         An outline is a white background svg circle.
//         Each textElts value is an arry with two svg text elements; the label.
//     `lines` is an array of svg line elements.
export function drawGraphWithPtMap(
    artist,
    ptMap,
    n,
    params  // Accepts edgeStyles, excludeHitDots, noListeners.
) {

    if (params === undefined) params = {};
    let edgeStyles     = params.edgeStyles;
    let excludeHitDots = params.excludeHitDots;
    let noListeners    = params.noListeners;

    if (excludeHitDots === undefined) excludeHitDots = false;

    // Add 'edges' to each point value in ptMap. Each `edges` value is a list of
    // [from, to, dest]; each of `from` and `to` is an {x, y} point. `dest` is
    // the permutation string of the other side of the edge.
    // The returned array `edges` is an array of
    // [fromPt, toPt, fromPerm, toPerm] values without redundancy.
    let edges = addPtMapEdges(n, ptMap);

    // Prepare the group elements.
    let edgeGroups = [];
    if (renderCtx.edgeWeighting === 'recursive') {
        for (let i = 0; i < n; i++) {
            edgeGroups.push(artist.add('g'));
        }
    }
    let edgeGroup    = artist.add('g');
    let outlineGroup = artist.add('g');
    let frontGroup   = artist.add('g');

    // Draw the edges.
    let lines = [];
    for (let i = 0; i < edges.length; i++) {
        let edge = edges[i];
        let thisStyle = edgeStyle;
        if (edgeStyles) {
            thisStyle['stroke-width'] = edgeStyles[i].coreWidth;
            thisStyle.baseColor = edgeStyles[i].coreColor;
            thisStyle.stroke = util.getColorStr(thisStyle.baseColor);
        } else if (renderCtx.edgeWeighting !== 'default') {
            thisStyle = Object.assign({}, edgeStyle);
            if (edge.hasOwnProperty('weightScale')) {
                thisStyle['stroke-width'] *= edge.weightScale;
            }
            if (edge.hasOwnProperty('strokeScale') && edge.strokeScale !== 1) {
                // This assumes the stroke is a hex-style shade of gray.
                let s = parseInt(thisStyle.stroke.slice(-2), 16);
                s = Math.ceil(s * edge.strokeScale);
                thisStyle.stroke = 'rgb(' + [s, s, s].join(',') + ')';
            }
        }
        let group = edgeGroup;
        if (renderCtx.edgeWeighting === 'recursive') {
            group = edgeGroups[edge.groupNum];
        }
        let line = artist.addLine(edge.from, edge.to, thisStyle, group);
        line.baseColor = thisStyle.stroke;
        line.fromIndex = edge.from.i;
        line.toIndex   = edge.to.i;
        push(ptMap[edge.p1], 'edgeElts', line);
        push(ptMap[edge.p2], 'edgeElts', line);
        lines.push(line);
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
    let pts      = [];
    let ptElts   = [];
    let entries  = [];
    for (const [perm, pt] of Object.entries(ptMap)) {
        // Uncomment the next line to help debug this function.
        // console.log(`Processing ${perm} with point ${pt.x}, ${pt.y}.`);
        let [outline, hitDot, circle] = addDot(
            artist,
            pt,
            outlineGroup,
            frontGroup,
            excludeHitDots
        );

        // Draw point labels.
        let eps = 0.01
        let leftBaseline = draw2.translate(pt, {x: eps, y: -eps});
        pt.textElts = [
            artist.addText(leftBaseline, perm, textOutlineStyle, outlineGroup),
            artist.addText(leftBaseline, perm, textStyle, frontGroup)
        ];
        pt.textElts.forEach(x => x.setAttribute('pointer-events', 'none'));

        pt.elt = circle;
        pts.push([pt.x, pt.y]);
        ptElts.push({dot: circle, outline, textElts: pt.textElts});

        if (noListeners) continue;
        let highlighter   = getGraphColorer(ptMap, pt, highlightColors);
        let unhighlighter = getGraphColorer(ptMap, pt, unhighlightColors);
        for (let elt of [hitDot, circle]) {
            if (elt === null) continue;  // We may exclude hit dots.
            elt.addEventListener('mouseover', highlighter);
            elt.addEventListener('mouseout',  unhighlighter);
        }
    }

    return [pts, ptElts, lines];
}

// Convert a permutation string like "21453" into cycles as arrays like
// [[1, 2], [3, 4, 5]]; this corresponds to "(12)(345)".
export function getCycleArray(permStr) {
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
    return cycles;
}

// Convert a permutation string like "21453" into a cycle string like
// "(12)(345)".
export function getCycleStr(permStr) {
    let cycles = getCycleArray(permStr);
    let s = cycles.map(c => `(${c.join('')})`).join('');
    if (s === '') s = 'e';  // Treat the identity as a special case.
    return s;
}

export function getMagnitude(permStr) {
    let cycles = getCycleArray(permStr);
    let magnitude = 0;
    for (let i = 0; i < cycles.length; i++) {
        magnitude += cycles[i].length - 1;
    }
    return magnitude;
}

// Render G_n is an n-partite graph in the rectangle from [-a, -b] to [a, b].
// The `params` objects can accept these optional values:
//  * orderingType   in ['plain', 'lex', 'random']
//  * excludeHitDots in [true, false] (default is false)
//  * noListeners    in [true, false] (default is false)
export function drawNPartiteGn(artist, n, params) {

    if (params === undefined) params = {};
    let orderingType   = params.orderingType;
    let excludeHitDots = params.excludeHitDots;
    let noListeners    = params.noListeners;

    let forAllPerms = getPermIterator(orderingType);

    let a = 0.8;
    let b = 0.8;

    let columns = [];
    for (let i = 0; i < n; i++) columns.push([]);

    let ptMap = {};
    forAllPerms(n, function (permStr) {
        let m = getMagnitude(permStr);
        columns[m].push(permStr);
    });

    let x = -a;
    let dx = 2 * a / (n - 1);
    for (let column of columns) {
        let y = 0;
        let dy = 0;
        // This is multiplied down a little to give us some buffer between pts.
        let maxUnitRadius = b / column.length * 0.7;
        if (column.length > 1) {
            // -b is the top.
            y = -b;
            dy = 2 * b / (column.length - 1);
        }
        for (let permStr of column) {
            ptMap[permStr] = {x, y, maxUnitRadius};
            y += dy;
        }
        x += dx;
    }
    drawGraphWithPtMap(artist, ptMap, n, params);
}

// Render G_n as a bipartitle graph in the rectangle from [-a,-b] to [a, b].
export function drawBipartiteGn(artist, n, useLexOrdering) {

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
    drawGraphWithPtMap(artist, ptMap, n);
}

export function drawRecursiveGn(artist, n, params) {

    if (params === undefined) params = {};
    let orderingType   = params.orderingType;

    let radius = 0.8;

    let ptMap = placeRecursivePtsInCircle(
        n,
        {cx: 0, cy: 0, r: radius},
        orderingType
    );
    drawGraphWithPtMap(artist, ptMap, n, params);
}

export function drawRandomGn(artist, n) {
    // Come up with a map from strings like "1432" to an {x, y} point in the
    // unit circle around the origin.
    let ptMap = makeRandomPtMap(n);
    drawGraphWithPtMap(artist, ptMap, n);
}

export function drawCircularGn(artist, n, params) {

    if (params === undefined) params = {};
    let orderingType   = params.orderingType;
    let excludeHitDots = params.excludeHitDots;
    let noListeners    = params.noListeners;

    let radius = 0.8;

    let forAllPerms = getPermIterator(orderingType);

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

    drawGraphWithPtMap(artist, ptMap, n, params);
}

// Returns [pts, labels]. `pts` is a list of 3d points (length-3 arrays), each
// of which represents one point of G_4. `labels` is an array of strings, each
// the label of its corresponding point; eg '1234' corresponds to the 3d
// projection of the 4d point (1, 2, 3, 4).
//
// The optional parameter `method` offers choices in how the projection from 4d
// down to 3d is done. This essentially results in a different rotational
// position of the final points. Providing no value or 'default' gives a natural
// projection which attempts to match the pre-existing axes. Providing 'random'
// will use a random projection (still orthogonal, so the shape is the same,
// just rotated); in this case randSeed is also used. Finally, you can send in a
// row (an array of length 4), and that 4d direction will be mapped, as closely
// as possible, to the x-axis.
export function getG4PointsIn3D(method='default', randSeed) {

    // Set up P, whose columns are 4d points of S_4
    let Pt = [];  // This will be a matrix whose rows are 4-permutations.
    let labels = [];
    forAllPermsLex(4, function (permStr) {
        let p = permStr.split('').map(x => parseInt(x));
        p = p.map(x => x - 2.5);  // Center around 0.
        Pt.push(p);
        labels.push(permStr);
    });
    let P = matrix.transpose(Pt);

    // Set up matrix S, which will allow us to project P into 3d.
    let At = null;
    if (method === 'default') At = matrix.eye(4);
    else if (method === 'random') {
        if (randSeed !== undefined) random.seed(randSeed);
        At = matrix.rand(4, 4);
    } else {
        console.assert(typeof method === 'object');
        At = matrix.eye(4);
        At[1] = method;
    }
    At[0] = [1, 1, 1, 1];  // We'll find a basis orthogonal to this.
    let A = matrix.transpose(At);
    let [Q, R] = matrix.qr(A);
    let Qt = matrix.transpose(Q);
    let S = Qt.slice(1);

    let pts = matrix.transpose(matrix.mult(S, P));
    return [pts, labels];
}

// This is the n-dimensional version of getG4PointsIn3D().
export function getGNPointsLessOne(n, method='default', randSeed) {

    // Set up P, whose columns are n-dim'l points of S_n
    let Pt = [];  // This will be a matrix whose rows are 4-permutations.
    let labels = [];
    let midVal = (1 + n) / 2;
    forAllPermsLex(n, function (permStr) {
        let p = permStr.split('').map(x => parseInt(x));
        p = p.map(x => x - midVal);  // Center around 0.
        Pt.push(p);
        labels.push(permStr);
    });
    let P = matrix.transpose(Pt);

    // Set up matrix S, which will allow us to project P into 3d.
    let At = null;
    if (method === 'default') At = matrix.eye(n);
    else if (method === 'random') {
        if (randSeed !== undefined) random.seed(randSeed);
        At = matrix.rand(n, n);
    } else {
        console.assert(typeof method === 'object');
        At = matrix.eye(n);
        At[1] = method;
    }
    At[0] = Array(n).fill(1);  // We'll find a basis orthogonal to this.
    let A = matrix.transpose(At);
    let [Q, R] = matrix.qr(A);
    let Qt = matrix.transpose(Q);
    let S = Qt.slice(1);

    let pts = matrix.transpose(matrix.mult(S, P));
    return [pts, labels];
}

// Returns [edges, slices], described next:
// `edges` is an array of {from, to} objects, one for each edge in
// G_n where the nodes, 0-indexed, are listed in lexicographic order.
// `slices` has slices[sliceName] = {lineIdx: colorIdx} for sliceName values
// like '0' for p_1 = constant or '0,2' for pi_1+pi_3 = constant; the constant
// value is reflected in `colorIdx`.
export function getEdgeIndexesLex(n, lightEdgeColor) {

    if (lightEdgeColor === undefined) lightEdgeColor = '#888';

    // List all permutations.
    let perms = [];
    forAllPermsLex(n, function (permStr) {
        perms.push(permStr);
    });

    // Make a reverse index.
    let indexOfPerm = {};
    for (let i = 0; i < perms.length; i++) indexOfPerm[perms[i]] = i;

    // Put together the result array of edges.
    let edges = [];
    let lineTypes = {1: 'edge', 2: 'face', 3: 'internal'};
    forAllTranspositions(n, function(t) {
        for (let i = 0; i < perms.length; i++) {
            let p1 = perms[i];
            let p2 = applyTransposition(p1, t);
            if (p1 > p2) continue;
            let line = {from: i, to: indexOfPerm[p2]};
            line.p1 = p1;
            line.p2 = p2;
            line.t  = t;
            let delta = Math.abs(parseInt(t[1]) - parseInt(t[2]));
            if (delta === 1) line.style = {'stroke-width': 1};
            if (lightEdgeColor === 'transparent' && delta === 2) {
                line.style = {stroke: 'transparent'};
            }
            if (delta > 2) line.style = {stroke: lightEdgeColor};
            // For downstream efficiency, simply omit transparent edges.
            if (line.style && line.style.stroke === 'transparent') continue;
            line.type = lineTypes[delta];  // edge, face, or internal

            edges.push(line);
        }
    });

    // Build up the slice index.
    // We'll have slices[sliceName] = {lineIdx: colorIdx}.
    let slices = {};
    for (let i = 0; i < edges.length; i++) {
        let line = edges[i];
        let [p1, p2] = [line.p1, line.p2];

        // Look for pi_i = constant slices.
        for (let j = 0; j < 4; j++) {
            if (p1[j] !== p2[j]) continue;
            set(slices, j, i, parseInt(p1[j]) - 1);
        }

        // Look for p_0 + p_i = constant slices.
        for (let j = 1; j < 4; j++) {
            let q1 = p1.split('').map(x => parseInt(x));
            let q2 = p2.split('').map(x => parseInt(x));
            if (q1[0] + q1[j] !== q2[0] + q2[j]) continue;
            set(slices, `0,${j}`, i, q1[0] + q1[j] - 3);
        }

        // Enable line coloring based on |i-j| for the edge (i j).
        let m = Math.abs(parseInt(line.t[1]) - parseInt(line.t[2]));
        set(slices, `m${m}`, i, m);
    }

    return [edges, slices];
}

// This returns an array of [pt1, pt2, ...] arrays, one for each face of the
// permutohedron of G_4. The 'points' are indexes into the list of vertices when
// the vertices are ordered lexicographically.
export function getG4FacesIn3D() {

    // List all permutations.
    let perms = [];
    forAllPermsLex(4, function (permStr) {
        perms.push(permStr);
    });

    // Put together the result array of faces.
    // This will map 'X:Y' to an array of point indexes for that face.
    // For example: '3:1' indicates permutations pi where pi_3=1.
    // This will also map 'XY:3' where pi_X + pi_Y = 3.
    let faces = {};
    for (let i = 0; i < perms.length; i++) {
        let a, b;
        for (let j = 0; j < 4; j++ ) {
            if (perms[i][j] === '1') push(faces, `${j}:1`, i);
            if (perms[i][j] === '4') push(faces, `${j}:4`, i);

            if (perms[i][j] === '1') a = j;
            if (perms[i][j] === '2') b = j;
        }
        if (b < a) [a, b] = [b, a];
        push(faces, `${a}${b}:3`, i);
    }

    return Object.values(faces);
}
