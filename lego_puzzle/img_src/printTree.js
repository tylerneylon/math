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

    let nonTopSep = ''.padEnd(topSep.length);
    for (let i = 0; i < numRows; i++) {
        let sep = (i === 0) ? topSep : nonTopSep;
        let msg = cols.map((col, j) => col[i].padEnd(widths[j])).join(sep);
        console.log(msg);
    }
}

// Run fn1() and fn2() on each node of the given tree in depth-first order.
// Each call is of the form fn(node, depth, childNum).
// For the root, `childNum` is undefined.
// Otherwise, `childNum` is the index of this node as a child of its parent.
// fn1() is called before its children, fn2() after.
function depthFirstTraverse(root, tree, fn1, fn2, depth, childNum) {
    if (depth === undefined) depth = 0;
    fn1(root, depth, childNum);
    tree[root]?.forEach((node, i) => {
        depthFirstTraverse(node, tree, fn1, fn2, depth + 1, i)
    });
    fn2(root, depth, childNum);
}

// Print out a tree like this:
// 1 - 2 -  3 -  4
//            \  5
//            \  6
//       \  7 -  8
//   \ 9 - 10 - 11
function printTree(root, tree) {
    let cols = [];
    let numRows = 0;
    depthFirstTraverse(root, tree, (node, depth, childNum) => {
        let prefix = '\\ ';
        if (childNum === undefined) prefix = '';
        if (childNum === 0) prefix = '- ';
        if (cols.length <= depth) cols.push([]);
        while (depth > 0 && cols[depth].length < cols[depth - 1].length - 1) {
            cols[depth].push('');
        }
        cols[depth].push(prefix + node);
        numRows = Math.max(numRows, cols[depth].length);
    }, (node, depth) => {
        while (cols[depth].length < numRows) cols[depth].push('');
    });
    showTableWithColumns(cols);
}

exports.printTree = printTree;


// ______________________________________________________________________
// Example usage

let t = {
    a: ['j', 'b', 'ccc'], b: ['d'], c: ['e'],
    d: ['f', 'g'], e: ['i'], g: ['h']
};
printTree('a', t);
