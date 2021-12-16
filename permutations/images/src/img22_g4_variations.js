/* img22_g4_variations.js
 *
 * Show, all in one spot, different key perspectives of G_4, and attempt to show
 * how they relate to each other through animation.
 *
 */


// ______________________________________________________________________
// Imports

import * as draw   from './draw.js';
import * as init   from './init.js';
import * as perm   from './perm.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

const itemSize = 250;
const xMargin  =  40;  // Add this space to both the left and right sides.

const edgeStyle = {
    stroke: '#eee',
    fill: 'transparent',
    'stroke-width': 1
};

let slider = null;
let artist = null;
const ptMaps = [];
let mainPtMap = null;
let [pts, ptElts, lines] = [null, null, null];


// ______________________________________________________________________
// Functions

function shiftMapToOffset(ptMap, offset) {
    // The slight tweaks to offsets 0 and 1 are to make the overall layout look
    // visually more pleasing.
    const xScale = (offset === 0 ? 0.65 : 0.5);
    const yScale = 0.5;
    const xSlide = (offset === 1 ? 0.45 : 0.5);
    const ySlide = 0.5;
    for (let xy of Object.values(ptMap)) {
        xy.x = xy.x * xScale + xSlide + offset;
        xy.y = xy.y * yScale + ySlide
    }
}

function renderPtMap(artist, ptMap) {
    const edges = perm.addPtMapEdges(4, ptMap);
    for (const edge of edges) {
        artist.addLine(edge.from, edge.to, edgeStyle);
    }
}

function getFlattenedPermutohedron() {
    let [rMin, rMax] = [0.1, 0.9];
    // I've chosen [0, -1, -1, -1] in order to keep the pi_1-based slices (which
    // are highlighted with edge colors) as interlocking hexagons.
    let [pts, labels] = perm.getG4PointsIn3D([0, -1, -1, -1]);
    let pts2d = util.explode3DPoints(pts, labels, rMin, rMax);
    let ptMap = {};
    for (const pt2d of pts2d) {
        // I'm negating the points in order to try to achieve a slightly nicer
        // transition from the recursive layout over to this one.
        ptMap[pt2d.label] = {x: -pt2d[0], y: -pt2d[1]};
    }
    return ptMap;
}

function updateGraphColoring() {
    let colors = [
        '#d44',
        '#d84',
        '#dd4',
        '#4d4'
    ];
    for (const [permStr, pt] of Object.entries(mainPtMap)) {
        let color = colors[parseInt(permStr.substr(0, 1)) - 1];
        let m = perm.getMagnitude(permStr);
        // let color = colors[m];
        pt.dotElt.setAttribute('fill', color);
        pt.dotElt.baseColor = color;
    }
    // This is a separate loop so we can depend on finalized node colors to help
    // us color the edges.
    for (const [permStr, pt] of Object.entries(mainPtMap)) {
        for (let i = 0; i < pt.edgeElts.length; i++) {
            const edge    = pt.edges[i];
            const edgeElt = pt.edgeElts[i];
            const fromColor = edge.from.dotElt.baseColor;
            const   toColor = edge.to.dotElt.baseColor;

            // Tone down the color a little.
            let stdColor = util.getStdColor(fromColor);
            let grayWeight = 0.5;
            let colorWeight = 1 - grayWeight;
            stdColor = stdColor.map(x => colorWeight * x + grayWeight * 0.86);
            let color = util.getColorStr(stdColor);

            if (fromColor === toColor) {
                edgeElt.baseColor = color;
                edgeElt.setAttribute('stroke', color);
            }
        }
    }
}

function updateMainPtMapElts() {
    let textOffset = {x: 0.015, y: -0.015};
    for (const pt of Object.values(mainPtMap)) {
        artist.moveCircle(pt.dotElt, pt);
        artist.moveCircle(pt.outlineElt, pt);
        artist.moveCircle(pt.hitDotElt, pt);
        let textBaseline = draw.translate(pt, textOffset);
        artist.moveText(pt.textElts[0], textBaseline);
        artist.moveText(pt.textElts[1], textBaseline);
        for (let i = 0; i < pt.edges.length; i++) {
            artist.moveLine(pt.edgeElts[i], pt.edges[i].from, pt.edges[i].to);
        }
    }
}

function drawFrame(ts) {
    window.requestAnimationFrame(drawFrame);

    // Implement snap to integer values.
    if (Math.abs(Math.round(slider.value) - slider.value) < 0.025) {
        slider.value = Math.round(slider.value);
    }

    let variant = parseFloat(slider.value);
    let left  = Math.floor(variant);
    let right = left + 1;
    let leftWeight  = right - variant;   // eg variant = 1.1, leftWeight  = 0.9
    let rightWeight = 1.0 - leftWeight;  // eg variant = 1.1, rightWeight = 0.1

    for (const [permStr, xy] of Object.entries(mainPtMap)) {
        // I'm phrasing things this way because we have the edge case where
        // left = maxValue and rightWeight = 0, in which case we don't want to
        // dereference the right map at all.
        xy.x = leftWeight * ptMaps[left][permStr].x;
        if (rightWeight) xy.x += rightWeight * ptMaps[right][permStr].x;
        xy.y = leftWeight * ptMaps[left][permStr].y;
        if (rightWeight) xy.y += rightWeight * ptMaps[right][permStr].y;
    }

    updateMainPtMapElts();
    artist.render();
}

function adjustFontSize() {
    for (const pt of Object.values(mainPtMap)) {
        for (const textElt of pt.textElts) {
            textElt.setAttribute('font-size', '10pt');
        }
    }
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    slider = document.getElementById('slider');

    artist = init.setup(5 * itemSize + 2 * xMargin, itemSize, 'canvas');
    const unitMargin = xMargin / itemSize;
    artist.setCoordLimits(-unitMargin, 5 + unitMargin, 0, 1);

    ptMaps.push(perm.getBipartiteGn(4));
    ptMaps.push(perm.getNPartiteGn(4));
    ptMaps.push(perm.getCircularGn(4));
    ptMaps.push(perm.getRecursiveGn(4));
    ptMaps.push(getFlattenedPermutohedron());
    for (let i = 0; i < ptMaps.length; i++) {
        shiftMapToOffset(ptMaps[i], i);
        renderPtMap(artist, ptMaps[i]);
    }

    mainPtMap = perm.getBipartiteGn(4);
    let params = {};  // XXX
    perm.drawGraphWithPtMap(artist, mainPtMap, 4, params);
    adjustFontSize();
    updateGraphColoring();

    window.requestAnimationFrame(drawFrame);

    slider.style.width = 4 * itemSize + 'px';
});
