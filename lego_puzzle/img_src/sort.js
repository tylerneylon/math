/* sort.js
 *
 * Sorting with partial information.
 *
 * This file defines a singleton class called Sorter, with a global callable
 * instance named `sort()`; I'll document as if this were a regular function
 * since you can (and are expected to) treat it like one.
 *
 * The sort() function sorts a given array by
 * using a provided comparison function. What's different about this
 * case is that the comparison function can return (in addition to
 * '<' or '>') the null value, indicating that the order of the
 * given pair is undetermined. In that case, it is up to the sorting alg
 * to determine if the pair must have a certain order based on the
 * transitive closure of other pairs, or if it remains undetermined
 * even in the closure. In the first case, the pair must have that order
 * in the final returned result; otherwise, the pair may have any order
 * in the final returned result.
 *
 * This file also contains some unit tests to help ensure that the
 * behavior of the sorting alg is correct.
 *
 */


// ______________________________________________________________________
// Control debugging behavior.

let dMode = false;
let logLevel = null;  // This will be updated from dbgCtx per sort call.


// ______________________________________________________________________
// Printing functions

let spaceChar = ' ';  // Alternative: &nbsp; for html.
let indentPrefix = '|' + spaceChar.repeat(3);
let prefix = '';

function indent() {
    prefix = prefix + indentPrefix;
}

function dedent() {
    prefix = prefix.substr(indentPrefix.length);
}

let doUseNumPrefix = true;
let numPrefix = 1;

function say(arr) {
    if (!Array.isArray(arr)) arr = [arr];
    arr.forEach(str => {
        let nPre = doUseNumPrefix ? String(numPrefix).padStart(4) + ': ' : '';
        console.log(nPre + prefix + str);
        numPrefix++;
    });
}

// This returns an array of strings that can be printed as the given table.
// You should add a newline to the end of the rows when printing.
function getRowsFromColumns(cols, colSep) {

    if (colSep === undefined) colSep = ' ';

    // Convert each cell to a string as needed.
    cols = cols.map(col => col.map(x => x + ''));

    let numRows = Math.max(...cols.map(x => x.length));
    cols.forEach(col => {
        while (col.length < numRows) col.push('');
    });

    // Find the maximum width in each column.
    let widths = cols.map(col => Math.max(...col.map(x => x.length)));

    let rows = [];
    for (let i = 0; i < numRows; i++) {
        rows.push(
            cols.map((col, j) => col[i].padStart(widths[j])).join(colSep)
        );
    }
    return rows;
}


// ______________________________________________________________________
// Tree traversal and printing functions

// This is a helper function for depth-first traversal.
function entries(arrOrObj) {
    const arr = Array.isArray(arrOrObj) ? arrOrObj : Object.keys(arrOrObj);
    return arr.entries();
}

// Run fn1() and fn2() on each node of the given tree in depth-first order.
// Each call is of the form fn(node, depth, childNum, path).
// For the root, `childNum` is undefined; it's not a child.
// Otherwise, `childNum` is the index of this node as a child of its parent.
// fn1() is called before its children, fn2() after.
// If fn1(node) returns 'skip', then all the children of `node` are skipped.
// If fn1(node) returns 'break', neither fn1() nor fn2() is called again.
// The format of `tree` is either:
// (a) tree[node] = array of child nodes; or
// (b) tree[node] = object whose keys are child nodes.
// In the latter case, an arbitrary order is chosen for keys in order to give
// them `childNum` values.
// ------
// By default, each downstream node will be visited once, unless it is skipped
// by a callback return value of 'break' or 'skip'. However, if opts.allPaths is
// set to `true`, then nodes will be visited once per incoming edge that is
// reachable from `root`, which may be more than once in total.
// ------
// The `toPrint` option, which is off by default, enables a mode in which nodes
// are visited once per incoming path, but only recursively traversed the first
// time. This mode each edge is visited once, and is useful for printing.
function depthFirstTraverse(root, tree, fn1, fn2, opts) {
    let {depth, childNum, nodeSet, seen, path, allPaths, toPrint} = opts || {};
    if (depth === undefined) depth = 0;
    if (seen === undefined) seen = {};
    if (path === undefined) path = [root];
    if (allPaths !== true && toPrint !== true && root in seen) return;
    let visitRootOnly = (toPrint && root in seen);
    // if (root in seen) return;
    seen[root] = true;
    let reply = fn1(root, depth, childNum, path);
    if (reply === 'break') return reply;
    if (reply !== 'skip' && tree[root] !== undefined && !visitRootOnly) {
        let i = 0;
        for (const node in tree[root]) {
            if (nodeSet && !(node in nodeSet)) continue;
            path.push(node);
            reply = depthFirstTraverse(node, tree, fn1, fn2, {depth: depth + 1,
                childNum: i++, nodeSet, seen, path, allPaths, toPrint});
            path.pop();
            if (reply === 'break') return reply;
        }
    }
    if (fn2) fn2(root, depth, childNum, path);
}

// This receives a dag (directed acyclic graph) and removes all edges x->y such
// that x-->y, meaning x can be reached by a longer path.
function transitiveReduce(roots, after, before) {

    // XXX Count the number of edges.
    let numEdgesBefore = 0;
    console.log('after', after); // XXX
    for (let childSet of Object.values(after)) {
        numEdgesBefore += Object.keys(childSet).length;
    }
    console.log(`At first there are ${numEdgesBefore} edges in the dag.`);
    let numEdgesRemoved = 0;

    for (let root of roots) {
        depthFirstTraverse(root, after, (node, depth, childNum, path) => {
            let elders = intersect(before[node], makeSet(path.slice(0, -2)));
            for (let elder in elders) {
                // XXX TODO: Can I safely change these during traversal, or
                // should I simply mark them and remove them after?
                removeFromSet(after[elder], node);
                removeFromSet(before[node], elder);
                numEdgesRemoved++;
            }
        });
    }

    // XXX Count the number of edges.
    console.log(`I removed ${numEdgesRemoved} edge(s).`);
    let numEdgesAfter = 0;
    for (let childSet of Object.values(after)) {
        numEdgesAfter += Object.keys(childSet).length;
    }
    console.log(`Afterwards, there are ${numEdgesAfter} edges.`);
    let perc = numEdgesRemoved / numEdgesBefore * 100;
    console.log(`I removed ${perc.toFixed(1)}% of the edges.`);
}

// Get a tree like this as a list of strings (no newlines):
// 1 - 2 - 3
//       \ 100 - 4
//   \ 5
//   \ 6 - 7   - 8
function getTree(root, tree, nodeSet) {
    let cols = [];
    let numRows = 0;
    let getName = tree.getName ?? (x => x);
    depthFirstTraverse(root, tree, (node, depth, childNum) => {
        let d = 2 * depth;
        while(cols.length <= d) cols.push([]);
        while (d - 1 > 0 && cols[d - 1].length < cols[d - 2].length - 1) {
            cols[d - 1].push('');
        }
        if (childNum === 0) cols[d - 1].push('-');
        if (childNum > 0)   cols[d - 1].push('\\');
        while (d > 0 && cols[d].length < cols[d - 1].length - 1)  {
            cols[d].push('');
        }
        cols[d].push(getName(node));
        numRows = Math.max(numRows, cols[d].length);
    }, (node, depth) => {
        for (let i = 2 * depth - 1; i <= 2 * depth; i++) {
            while (i > 0 && cols[i].length < numRows) cols[i].push('');
        }
    }, {nodeSet, toPrint: true});
    return getRowsFromColumns(cols);
}

function printForest(roots, tree, nodeSet) {
    let cols = roots.map(root => getTree(root, tree, nodeSet));
    say(getRowsFromColumns(cols, '  |  '));
}


// ______________________________________________________________________
// Helper functions for layered data

function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

function pushToSet(elt, prop, newItem) {
    if (!(prop in elt)) elt[prop] = {};
    elt[prop][newItem] = true;
}


// ______________________________________________________________________
// Functions for objects as sets

function removeFromSet(set, item) {
    if (item in set) delete set[item];
}

function makeSet(arr) {
    let set = {};
    arr.forEach(elt => {set[elt] = true;});
    return set;
}

function setSize(obj) {
    return Object.keys(obj).length;
}

function intersect(...sets) {
    return sets.reduce((isect, thisSet) => {
        const result = {};
        for (let key in isect) {
            if (thisSet[key]) result[key] = true;
        }
        return result;
    }, sets[0]);
}

function unionXintoY(x, y) {
    for (let elt in x) y[elt] = true;
}

function pickInSet(s) {
    if (setSize(s) === 0) return null;
    return Object.keys(s)[0];
}

function pickInSets(...sets) {
    return pickInSet(intersect(...sets));
}

function arrOfSet(s) {
    return Object.keys(s);
}


// ______________________________________________________________________
// Define the Sorter class and sort() function

class Sorter extends Function {
    constructor() {
        super()    
        return new Proxy(this, {
            apply: (target, thisArg, args) => target._call(...args)
        })
    }

    // Define the cmp wrapper function that uses the cache.
    cmp(a, b) {
        let key = a + ':' + b;
        if (key in this.cache) return this.cache[key];

        let result = '=';
        if (a !== b) {
            this.numCmpCalls++;
            result = this.inputCmp(
                this.inputArr[a], this.inputArr[b], this.cmpCtx
            );
        }
        this.cache[key] = result;

        let symResult = {'>': '<', '<': '>', '=': '='}[result];
        this.cache[b + ':' + a] = symResult;

        return result;
    }

    strOfArr(arr) {
        return arr.map(x => this.label(x)).join(' ');
    }

    makeXBeforeY(x, y) {
        pushToSet(this.after, x, y);
        // if (y in this.before) removeFromSet(this.after[this.before[y]], y);
        // this.before[y] = x;
        pushToSet(this.before, y, x);
        removeFromSet(this.roots, y);
    }

    // This is only called during opportunistic transitive reduction from depth
    // traversal; as a result, we don't need to check that y becomes a root
    // because it will always have another path leading to it.
    removeXYedge(x, y) {
        removeFromSet(this.after[x], y);
        removeFromSet(this.before[y], x);
    }

    // TODO as of 501.2023
    // * I can clean up the code by clearly sectioning things up by the set
    //   interface and the abstract debug interface.
    // * It may be worthwhile to create a set class. I just learned there is
    //   already a Set type. I can look into using that instead.

    dbgStart(arr) {
        let getName = dbgCtx.getName ?? (x => x);

        // This returns a string|stringifiable label for the input at index x.
        this.label = idx => getName(this.inputArr[idx]);

        if (logLevel < 1) return;
        say('Start sort() with arr: ' + this.strOfArr(arr));
        indent();
    }

    dbgPushing(newItem) {
        if (logLevel < 2) return;
        let getName = dbgCtx.getName ?? (x => x);
        say(`Pushing ${getName(this.inputArr[newItem])} onto sorted`);
    }

    dbgEnd(sorted, arrSet) {
        if (logLevel < 1) return;
        say(`numCmpCalls = ${this.numCmpCalls}`);
        dedent();
        say('End sort(); returning ' + this.strOfArr(sorted));
        if (logLevel < 3) return;
        say('Just-sorted forest:');
        printForest(Object.keys(this.roots), this.after, arrSet);
    }

    dbgEndByBaseCase(arr) {
        if (logLevel < 1) return;
        say(`numCmpCalls = ${this.numCmpCalls}`);
        dedent();
        say('End sort(); returning ' + this.strOfArr(arr));
    }

    dbgStartOfLoop(subsetRootsToSort, arrSet) {
        if (logLevel >= 3) {
            say('roots forest:');
            say('_'.repeat(30));
            printForest(Object.keys(this.roots), this.after);
            say('_'.repeat(30));
        }

        if (logLevel >= 2) {
            let roots = arrOfSet(subsetRootsToSort).map(x => this.label(x));
            say(
                `Start of loop: subsetRootsToSort has length ` +
                `${setSize(subsetRootsToSort)}: [${roots.join(' ')}]`
            );

            // Print out the full forest.
            say('subsetRootsToSort Forest:');
            say('_'.repeat(30));
            printForest(arrOfSet(subsetRootsToSort), this.after, arrSet);
            say('_'.repeat(30));
        }
    }

    dbgReportMinSoFar(minSoFar) {
        if (logLevel < 3) return
        say(`Trying minSoFar:${this.label(minSoFar)}`);
    }

    dbgSkippingNode(root, minSet) {
        if (logLevel < 3) return;
        say(`Skipping cmp w ${this.label(root)}; it's in minSet: ` +
            this.strOfArr(Object.keys(minSet))
        );
    }

    dbgFoundCmp(minSoFar, c, root) {
        if (logLevel < 3) return;
        let lhs = this.label(minSoFar);
        let rhs = this.label(root);
        say(`Found that ${lhs} ${c} ${rhs}`);
    }

    dbgSubnodeLess(node) {
        if (logLevel < 2) return;
        say(`Found subnode (${this.label(node)}) < minSoFar`);
    }

    dbgMinimalRoot(root) {
        if (logLevel < 2) return;
        say(`No sub-nodes (of ${this.label(root)}) were smaller`);
    }

    // Turn this off for greater speed. Turn on to help debug.
    // This can dramatically slow down the algorithm.
    confirmInvariants(subsetRootsToSort, set1, set2) {

        // Confirm that the roots are exactly those nodes with no incoming
        // edges.
        for (let i = 0; i < this.inputArr.length; i++) {
            let isRoot = (!(i in this.before) ||
                          setSize(this.before[i]) === 0);
            assert((i in this.roots) === isRoot);
        }

        // Confirm that all roots are minimal within their set (set1/set2).
        for (let root in subsetRootsToSort) {
            let set = (root in set1) ? set1 : set2;
            for (let other in set) {
                let c = this.cmp(root, other);
                let rLabel = this.label(root);
                let oLabel = this.label(other);
                assert(
                    c !== '>',
                    `cmp(root (${rLabel}), other (${oLabel}, same set)) = ${c}`
                );
            }
        }

        // Confirm that before and after are consistent.
        for (let i = 0; i < this.inputArr.length; i++) {
            for (let j in (this.before[i] || {})) {
                assert(i in this.after[j]);
            }
            for (let j in (this.after[i] || {})) {
                assert(i in this.before[j]);
            }
        }
    }

    // Confirm that minSoFar is indeed minimal among all subtrees checked so
    // far. This is slow and should be turned off unless you're debugging.
    checkMinSoFarInvariant(minSoFar, rootsChecked, set1, set2) {

        assert(minSoFar in set1 || minSoFar in set2);

        for (let root in rootsChecked) {
            depthFirstTraverse(root, this.after, (node) => {
                assert(this.cmp(minSoFar, node) !== '>');
            });
        }
    }

    _call(inputArr, inputCmp, cmpCtx, subsetArr) {

        logLevel = logLevel || dbgCtx.logLevel;
        dMode    = dMode || dbgCtx.debugMode;

        this.inputArr = inputArr;
        this.inputCmp = inputCmp;

        if (subsetArr === undefined) {
            // This is an initial call; we must initialize some values.
            subsetArr   = inputArr.map((e, i) => i);
            this.cmpCtx = cmpCtx;
            this.cache  = {};
            this.after  = {inputArr, getName: (x => inputArr[x])};
            if (dbgCtx.getName) {
                this.after.getName = (x => dbgCtx.getName(inputArr[x]));
            }
            this.before = {};
            this.roots  = makeSet(subsetArr);  // The set of roots.
            this.inputArr = inputArr;
            this.numCmpCalls = 0;
        }

        if (dMode) this.dbgStart(subsetArr);

        // Define the base case.
        if (subsetArr.length < 2) {
            if (dMode) this.dbgEndByBaseCase(subsetArr);
            return {sorted: subsetArr, inputArr: inputArr, before: this.before};
        }

        // Implement the recursive case.
        let k = Math.floor(subsetArr.length / 2);
        let set1 = makeSet(subsetArr.slice(0, k));
        let set2 = makeSet(subsetArr.slice(k));
        sort(inputArr, inputCmp, cmpCtx, subsetArr.slice(0, k));
        sort(inputArr, inputCmp, cmpCtx, subsetArr.slice(k));
        let subsetToSort = makeSet(subsetArr);

        let sorted = [];
        let subsetRootsToSort = makeSet(
            arrOfSet(this.roots).filter(root => root in subsetToSort)
        );

        if (logLevel >= 3 && dMode) {
            say('subsetRootsToSort = ' + arrOfSet(subsetRootsToSort).join(' '));
        }

        while (setSize(subsetRootsToSort) > 0) {

            if (dMode) {
                this.dbgStartOfLoop(subsetRootsToSort, makeSet(subsetArr));
                this.confirmInvariants(subsetRootsToSort, set1, set2);
            }

            // Choose minSoFar from the side with more unsorted elements in it.
            // This heuristic aims to reduce the number of comparison calls.

            let largerSet = (setSize(set1) > setSize(set2)) ? set1 : set2;
            let minSoFar  = pickInSets(subsetRootsToSort, largerSet);
            if (minSoFar === null) minSoFar = pickInSets(subsetRootsToSort);
            let minSet = (minSoFar in set1) ? set1 : set2;

            if (dMode) this.dbgReportMinSoFar(minSoFar);

            let rootsChecked = {};
            let subsetRootsToSortArr = Object.keys(subsetRootsToSort);
            for (let i = 0; i < subsetRootsToSortArr.length; i++) {
                let root = subsetRootsToSortArr[i];
                if (dMode) {
                    this.checkMinSoFarInvariant(
                        minSoFar, rootsChecked, set1, set2
                    );
                }
                rootsChecked[root] = true;

                if (root === minSoFar) continue;
                depthFirstTraverse(root, this.after, (node) => {
                    /*
                    if (node in minSet) {
                        if (dMode) this.dbgSkippingNode(node, minSet);
                        return;
                    }
                    */
                    let c = this.cmp(minSoFar, node);
                    if (dMode) this.dbgFoundCmp(minSoFar, c, node);
                    if (c === '<') {
                        this.makeXBeforeY(minSoFar, node);
                        removeFromSet(subsetRootsToSort, node);
                        return 'skip';
                    }
                    if (c === '>') {
                        if (dMode) this.dbgSubnodeLess(node);
                        this.makeXBeforeY(node, minSoFar);
                        removeFromSet(subsetRootsToSort, minSoFar);
                        minSoFar = root;
                        minSet = (minSoFar in set1) ? set1 : set2;
                        i = -1;
                        rootsChecked = {};
                        return 'break';
                    }
                });
            }

            if (dMode) this.dbgPushing(minSoFar);
            sorted.push(minSoFar);
            delete minSet[minSoFar];
            removeFromSet(subsetRootsToSort, minSoFar);
            removeFromSet(subsetToSort, minSoFar);
            for (const node in this.after[minSoFar]) {
                // Promote children to roots if they're in subsetToSort and all
                // of their immediate parents are not.
                if (!(node in subsetToSort)) continue;
                if (!arrOfSet(this.before[node]).some(
                        parent => (parent in subsetToSort))) {
                    subsetRootsToSort[node] = true;
                }
            }
        }

        if (dMode) this.dbgEnd(sorted, makeSet(subsetArr));

        return {
            sorted: sorted.map(i => inputArr[i]),
            inputArr: this.inputArr,
            before: this.before
        }
    }
}

export const sort = new Sorter();
export const dbgCtx = {logLevel: 2};


// ______________________________________________________________________
// Helper functions for tests

let activeTest = null;

function check(bool, msg) {
    if (!bool) {
        console.log(`${activeTest.name} failed`);
        if (msg) console.log(msg);
        process.exit(1);
    }
}

function checkArraysAreSame(arr1, arr2) {
    check(arr1.length === arr2.length);
    for (let i = 0; i < arr1.length; i++) {
        check(arr1[i] === arr2[i]);
    }
}

function checkArrayRespectsKnownOrders(arr, knownOrders) {
    knownOrders.forEach(order => {
        for (let i = 0; i < order.length - 1; i++) {
            let elt1 = order[i];
            let elt2 = order[i + 1];
            let i1   = arr.indexOf(elt1);
            let i2   = arr.indexOf(elt2);
            check(i1 >= 0 && i2 >= 0 && i1 < i2);
        }
    });
}


// ______________________________________________________________________
// Tests definitions

// This is convenient to have around.
function usualCmp(x, y) {
    if (x === y) return '=';
    return (x < y) ? '<' : '>';
}

// Test with a standard total ordering.
function test1() {
    let arr = [0, 1];
    function cmp(x, y) {
        return (x < y) ? '<' : (x > y ? '>' : '=');
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    check(result[0] === 0 && result[1] === 1);
}

// Test with a standard total ordering; larger array this time.
function test2() {
    let arr = [...Array(10).keys()];
    function cmp(x, y) {
        return (x < y) ? '<' : (x > y ? '>' : '=');
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    check(result.every((x, i) => (x === i)));
}


// This is a general test function meant to be called multiple times
// with different integer-valued arrays.
function testWithWeirdCmp(arr, goalArr) {
    // This cmp() maintains the usual order against 0, but
    // otherwise: * pos vs neg is null; and
    //            * x vs y (same-sign) returns |x| vs |y|
    // So the determined order will be like -1, -2, -3, .. -k, 0, 1, 2, ...
    function  cmp(x, y) {
        if (Math.sign(x) === Math.sign(y)) {
            return usualCmp(Math.abs(x), Math.abs(y));
        }
        if (x === 0 || y === 0) return usualCmp(x, y);
        return null;
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    checkArraysAreSame(result, goalArr);
}

// The next two tests check performance on a partial comparison function with a
// single element (0) as a kind of bottleneck between two subcases that are
// otherwise non-comparable.

function test3() {
    let k = 1;
    let n = 2 * k + 1;
    let arr = Array.from({length: n}, (_, i) => i - k);
    let goalArr = [-1, 0, 1];
    testWithWeirdCmp(arr, goalArr);
}

function test4() {
    let k = 4;
    let n = 2 * k + 1;
    let arr = Array.from({length: n}, (_, i) => i - k);
    let goalArr = [-1, -2, -3, -4, 0, 1, 2, 3, 4];
    testWithWeirdCmp(arr, goalArr);
}

// Try a case with two distince bottlenecks. Specifically:
// * The target sorted order is (1 2 3) -1 (4 5 6) -2 (7 8 9)
// * Within a paren-group, the sorting is normal.
// * Neg-neg: normal sorting on absolute values.
// * pos(x)-neg(y): Return [x vs 3*|y| + 0.5].
function test5() {
    let arr = [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    function cmp(x, y) {
        if (Math.sign(x) === 1 && Math.sign(y) === -1) {
            return usualCmp(x, 0.5 - 3 * y);
        }
        if (Math.sign(x) === -1 && Math.sign(y) === 1) {
            return usualCmp(0.5 - 3 * x, y);
        }
        if (Math.sign(x) === -1 && Math.sign(y) === -1) {
            return usualCmp(-x, -y);
        }
        if (Math.floor((x - 1) / 3) === Math.floor((y - 1) / 3)) {
            return usualCmp(x, y);
        }
        return null;
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    let goalArr = [1, 2, 3, -1, 4, 5, 6, -2, 7, 8, 9];
    checkArraysAreSame(result, goalArr);
}

// This case has two components.
// Numbers are in the usual order, but negatives and positives always have
// null comparisons, and I'll exclude 0.
function test6() {
    let arr = [-4, -3, -2, -1, 1, 2, 3, 4];
    function cmp(x, y) {
        if (Math.sign(x) !== Math.sign(y)) return null;
        if (x < y) return '<';
        if (x > y) return '>';
        return '=';
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    checkArrayRespectsKnownOrders(
        result,
        [[-4, -3, -2, -1], [1, 2, 3, 4]]
    );
}

// The purpose of this test is to work with a connected but ambiguous order.
// This order is 1 - 2 - 3 - (4 - 5 - 6) (7 - 8 - 9),
// where 3 is < everthing to the right of it, but the chains
// (4 - 5 - 6) and (7 - 8 - 9) are independent.
function test7() {
    let arr = Array.from({length: 9}, (_, i) => i + 1);
    function cmp(x, y) {
        let xBlock = Math.floor((x - 1) / 3);
        let yBlock = Math.floor((y - 1) / 3);
        if (xBlock === yBlock || xBlock === 0 || yBlock === 0) {
            if (x < y) return '<';
            if (x > y) return '>';
            return '=';
        }
        return null;
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    checkArrayRespectsKnownOrders(
        result,
        [[1, 2, 3], [3, 4, 5, 6], [3, 7, 8, 9]]
    );
}

// The purpose of this test is to help reveal a possible bug when we have a kind
// of anti-tree in the cmp(). What I mean is that many elements are known to be
// less than a single central one, but are otherwise not comparable.
function test8() {
    let arr = Array.from({length: 5}, (_, i) => i + 1);
    // Everything will be < 1, but otherwise all cmp() returns are null.
    function cmp(x, y) {
        if (x === y) return '=';
        if (x === 4) return '>';
        if (y === 4) return '<';
        return null;
    }
    let result = sort(arr, cmp)['sorted'];
    console.log('result:');
    console.log(result);
    checkArrayRespectsKnownOrders(
        result,
        [[1, 4], [2, 4], [3, 4], [5, 4]]
    );
}

// Helper functions to make dags.
// These accept and return objects of the form {roots, after, before}.
// The nodes are the integers 1 through n.

function makeEmptyDag(numNodes) {
    let roots = makeSet([...Array(numNodes).keys()].map(x => x + 1));
    return {roots, after: {}, before: {}};
}

function addEdge(dag, from, to) {
    pushToSet(dag.after, from, to);
    pushToSet(dag.before, to, from);
    removeFromSet(dag.roots, to);
}

function checkSetsAreEqual(set1, set2, msg) {
    msg = msg || '';
    msg = `${msg} set1=${arrOfSet(set1)} set2=${arrOfSet(set2)}`;
    let arr1 = arrOfSet(set1);
    let arr2 = arrOfSet(set2);
    check(arr1.length === arr2.length, msg);
    for (let item of arr1) check(item in set2, msg);
}

function checkDagsMatch(dag1, dag2) {
    checkSetsAreEqual(dag1.roots, dag2.roots, 'root set equality');
    checkSetsAreEqual(dag1.after, dag2.after, 'after src set equality');
    checkSetsAreEqual(dag1.before, dag2.before, 'before src set equality');
    for (let key in dag1.after) {
        checkSetsAreEqual(dag1.after[key], dag2.after[key], `after[${key}] eq`);
    }
    for (let key in dag1.before) {
        let msg = `before[${key}] equality`;
        checkSetsAreEqual(dag1.before[key], dag2.before[key], msg);
    }
}

// This is a test of transitiveReduce().
// This is a simple case with 1 -> 2 -> 3 and 1 -> 3.
// We want only edge 1 -> 3 to be pruned.
function trTest1() {

    let dag = makeEmptyDag(3);
    addEdge(dag, 1, 2);
    addEdge(dag, 1, 3);
    addEdge(dag, 2, 3);

    let {roots, after, before} = dag;
    roots = arrOfSet(roots);
    printForest(roots, dag.after);
    transitiveReduce(roots, after, before);
    printForest(roots, dag.after);

    // Build the target dag.
    let targetDag = makeEmptyDag(3);
    addEdge(targetDag, 1, 2);
    addEdge(targetDag, 2, 3);

    checkDagsMatch(dag, targetDag);
}

function makeDagFromEdges(numNodes, edges) {
    let dag = makeEmptyDag(numNodes);
    for (let edge of edges) addEdge(dag, edge[0], edge[1]);
    return dag;
}


// This is a test of transitiveReduce().
function trTest2() {

    let edges = [
        [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 5], [4, 6], [5, 6]
    ];
    let dag = makeDagFromEdges(6, edges);

    let {roots, after, before} = dag;
    roots = arrOfSet(roots);
    printForest(roots, dag.after);
    transitiveReduce(roots, after, before);
    printForest(roots, dag.after);

    edges = [
        [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6]
    ];
    let targetDag = makeDagFromEdges(6, edges);

    checkDagsMatch(dag, targetDag);
}


// ______________________________________________________________________
// Run the tests

function assert(condition, msg) {
    if (!condition) {
        if (msg) console.log('Error:', msg);
        die;  // This purposefully causes an error to stop execution.

        // This file is designed to run as both a library in a browser as well
        // as a unit test from node. Hacky? Yes. But it works and in my opinion
        // is simpler than alternatives.
    }
}

if (typeof window === 'undefined') {

    dMode = true;
    logLevel = 3;

    // This is `false` by default, running all unit tests.
    // Set this to true to focus on a single test in the immediately following
    // focus block.
    let focusMode = false;

    // A place to focus on a single unit test at a time.
    if (focusMode) {
        activeTest = trTest2;
        activeTest();
        console.log('Passed!');
    }

    if (!focusMode) {
        let allTests = [
            test1, test2, test3, test4, test5,
            test6, test7, test8];
        allTests.forEach(testFn => {
            activeTest = testFn;
            console.log('\n' + '_'.repeat(80));
            console.log(`Running ${testFn.name}`);
            testFn();
            // We only get this far if the test passed.
            console.log('Passed!');
        });
        console.log('Done running all tests!');
    }

    if (false) {
        let arr = [1, 0, 3, 6, 5, 2, 4];
        function cmp(x, y) {
            return (x < y) ? '<' : (x > y ? '>' : '=');
        }
        let result = sort(arr, cmp)['sorted'];
        console.log('result:');
        console.log(result);
    }
}

