/* img22_g4_variations.js
 *
 * Show, all in one spot, different key perspectives of G_4, and attempt to show
 * how they relate to each other through animation.
 *
 */


// ______________________________________________________________________
// Imports

// TODO needed?
import * as init   from './init.js';
import * as matrix from './matrix.js';
import * as perm   from './perm.js';
import * as space  from './space.js';
import * as util   from './util.js';


// ______________________________________________________________________
// Globals

const itemSize = 300;

const edgeStyle = {
    stroke: '#ddd',
    fill: 'transparent',
    'stroke-width': 1.5
};


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
    let [pts, labels] = perm.getG4PointsIn3D();
    let pts2d = util.explode3DPoints(pts, labels, rMin, rMax);
    let ptMap = {};
    for (const pt2d of pts2d) {
        ptMap[pt2d.label] = {x: pt2d[0], y: pt2d[1]};
    }
    return ptMap;
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    const artist = init.setup(5 * itemSize, itemSize, 'canvas');
    artist.setCoordLimits(0, 5, 0, 1);

    const ptMaps = [];
    ptMaps.push(perm.getBipartiteGn(4));
    ptMaps.push(perm.getNPartiteGn(4));
    ptMaps.push(perm.getCircularGn(4));
    ptMaps.push(perm.getRecursiveGn(4));
    ptMaps.push(getFlattenedPermutohedron());
    for (let i = 0; i < ptMaps.length; i++) {
        shiftMapToOffset(ptMaps[i], i);
        renderPtMap(artist, ptMaps[i]);
    }

    artist.autorender();

});
