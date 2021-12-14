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
    for (let xy of Object.values(ptMap)) {
        xy.x = xy.x / 2 + 0.5 + offset;
        xy.y = xy.y / 2 + 0.5;
    }
}

function renderPtMap(artist, ptMap) {
    const edges = perm.addPtMapEdges(4, ptMap);
    for (const edge of edges) {
        artist.addLine(edge.from, edge.to, edgeStyle);
    }
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
    for (let i = 0; i < ptMaps.length; i++) {
        shiftMapToOffset(ptMaps[i], i);
        renderPtMap(artist, ptMaps[i]);
    }

    artist.autorender();

});
