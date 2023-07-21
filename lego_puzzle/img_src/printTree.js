/* printTree.js
 *
 * A little function to print out a tree via console.log().
 *
 * The tree is expected to be an object whose keys (aka properties) are
 * treated as nodes; each node mapping to an array of its children.
 * Leaf nodes don't need to be present as keys.
 *
 * Here is an example tree with root element 'a':
 * t = {a: ['b', 'c'], b: ['d'], c: ['e'], d: ['f', 'g'], g: ['h']}
 *
 * If you run printTree('a', t), you get this output:
 *
 * a - b - d - f - h
 *           \ g
 *   \ c - e
 *
 */


// ______________________________________________________________________
// Functions

function showTableWithColumns(cols, topSep) {

    if (topSep === undefined) topSep = ' ';

    // Convert each cell to a string as needed.
    cols = cols.map(col => col.map(x => x + ''));

    let numRows = Math.max(...cols.map(x => x.length));
    cols.forEach(col => {
        while (col.length < numRows) col.push('');
    });

    // Find the maximum width in each column.
    let widths = cols.map(col => Math.max(...col.map(x => x.length)));

    let nonTopSep = ''.padStart(topSep.length);
    for (let i = 0; i < numRows; i++) {
        let sep = (i === 0) ? topSep : nonTopSep;
        let msg = cols.map((col, j) => col[i].padStart(widths[j])).join(sep);
        console.log(msg);
    }
}

// This returns an object that maps each node in the tree rooted at `root`
// to the number of leaf descendents it has.
function findNumLeafDesc(root, tree, numLeafDesc) {

    if (numLeafDesc === undefined) numLeafDesc = {};

    tree[root]?.forEach(kid => {
        findNumLeafDesc(kid, tree, numLeafDesc);
    });
    if (!(root in tree) || tree[root].length === 0) {
        numLeafDesc[root] = 1;
    } else {
        let descPerKid = tree[root].map(x => numLeafDesc[x]);
        numLeafDesc[root] = descPerKid.reduce((x, y) => x + y);
    }

    return numLeafDesc;
}

// Run fn() on each node of the given tree in depth-first order.
// Each call is of the form fn(node, depth, childNum).
// For the root, `childNum` is undefined.
// Otherwise, `childNum` is the index of this node as a child of its parent.
function depthFirstTraverse(root, tree, fn, depth, childNum) {
    if (depth === undefined) depth = 0;
    fn(root, depth, childNum);
    tree[root]?.forEach((node, i) => {
        depthFirstTraverse(node, tree, fn, depth + 1, i)
    });
}

// Print out a tree like this:
// 1 - 2 -  3 -  4
//            \  5
//            \  6
//       \  7 -  8
//   \ 9 - 10 - 11
function printTree(root, tree) {
    let numLeafDesc = findNumLeafDesc(root, tree);
    let cols = [];
    depthFirstTraverse(root, tree, (node, depth, childNum) => {
        let prefix = '\\ ';
        if (childNum === undefined) prefix = '';
        if (childNum === 0) prefix = '- ';
        if (cols.length <= depth) cols.push([]);
        cols[depth].push(prefix + node);
        for (let i = 1; i < numLeafDesc[node]; i++) cols[depth].push('');
    });
    showTableWithColumns(cols);
}

exports.printTree = printTree;


// ______________________________________________________________________
// Example usage

let t = {a: ['b', 'c'], b: ['d'], c: ['e'], d: ['f', 'g'], g: ['h']};
printTree('a', t);
