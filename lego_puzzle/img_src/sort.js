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
// Each call is of the form fn(node, depth, childNum).
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
function depthFirstTraverse(root, tree, fn1, fn2, opts) {
    let {depth, childNum, nodeSet} = opts || {};
    if (depth === undefined) depth = 0;
    let reply = fn1(root, depth, childNum);
    if (reply === 'break') return reply;
    if (reply !== 'skip' && tree[root] !== undefined) {
        for (const [i, node] of entries(tree[root])) {
            if (nodeSet && !(node in nodeSet)) continue;
            reply = depthFirstTraverse(node, tree, fn1, fn2,
                {depth: depth + 1, childNum: i, nodeSet});
            if (reply === 'break') return reply;
        }
    }
    if (fn2) fn2(root, depth, childNum);
}

// Get a tree like this as a list of strings (no newlines):
// 1 - 2 - 3
//       \ 100 - 4
//   \ 5
//   \ 6 - 7   - 8
function getTree(root, tree, nodeSet) {
    let cols = [];
    let numRows = 0;
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
        cols[d].push(tree.inputArr[node]);
        numRows = Math.max(numRows, cols[d].length);
    }, (node, depth) => {
        for (let i = 2 * depth - 1; i <= 2 * depth; i++) {
            while (i > 0 && cols[i].length < numRows) cols[i].push('');
        }
    }, {nodeSet});
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

let logLevel = 3;

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
        return arr.map(x => this.inputArr[x]).join(' ');
    }

    makeXBeforeY(x, y) {
        pushToSet(this.after, x, y);
        // if (y in this.before) removeFromSet(this.after[this.before[y]], y);
        // this.before[y] = x;
        pushToSet(this.before, y, x);
        removeFromSet(this.roots, y);
    }

    // TODO as of 501.2023
    // * I can clean up the code by clearly sectioning things up by the set
    //   interface and the abstract debug interface.
    // * It may be worthwhile to create a set class. I just learned there is
    //   already a Set type. I can look into using that instead.

    dbgStart(arr) {
        if (logLevel < 1) return;
        say('Start sort() with arr: ' + this.strOfArr(arr));
        indent();
    }

    dbgEnd(sorted) {
        if (logLevel < 1) return;
        say(`numCmpCalls = ${this.numCmpCalls}`);
        dedent();
        say('End sort(); returning ' + this.strOfArr(sorted));
    }

    dbgEndByBaseCase(arr) {
        if (logLevel < 1) return;
        say(`numCmpCalls = ${this.numCmpCalls}`);
        dedent();
        say('End sort(); returning ' + this.strOfArr(arr));
    }

    dbgStartOfLoop(arrRoots, arrSet) {
        if (logLevel >= 3) {
            say('roots forest:');
            say('_'.repeat(30));
            printForest(Object.keys(this.roots), this.after);
            say('_'.repeat(30));
        }

        if (logLevel >= 2) {
            let roots = arrOfSet(arrRoots).map(x => this.inputArr[x]);
            say(
                `Start of loop: arrRoots has length ${setSize(arrRoots)}: ` +
                `[${roots.join(' ')}]`
            );

            // Print out the full forest.
            say('arrRoots Forest:');
            say('_'.repeat(30));
            printForest(arrOfSet(arrRoots), this.after, arrSet);
            say('_'.repeat(30));
        }
    }

    dbgReportMinSoFar(minSoFar) {
        if (logLevel < 3) return
        say(`Trying minSoFar:${this.inputArr[minSoFar]}`);
    }

    dbgSkippingNode(root, minSet) {
        if (logLevel < 3) return;
        say(`Skipping cmp w ${this.inputArr[root]}; it's in minSet: ` +
            this.strOfArr(Object.keys(minSet))
        );
    }

    dbgFoundCmp(minSoFar, c, root) {
        if (logLevel < 3) return;
        let lhs = this.inputArr[minSoFar];
        let rhs = this.inputArr[root];
        say(`Found that ${lhs} ${c} ${rhs}`);
    }

    dbgSubnodeLess(node) {
        if (logLevel < 2) return;
        say(`Found subnode (${this.inputArr[node]}) < minSoFar`);
    }

    dbgMinimalRoot(root) {
        if (logLevel < 2) return;
        say(`No sub-nodes (of ${this.inputArr[root]}) were smaller`);
    }

    // Turn this off for greater speed. Turn on to help debug.
    // This can dramatically slow down the algorithm.
    confirmInvariants(set1, set2) {

        // Confirm that the roots are exactly those nodes with no incoming
        // edges.
        for (let i = 0; i < this.inputArr.length; i++) {
            let isRoot = (!(i in this.before) ||
                          setSize(this.before[i]) === 0);
            console.assert((i in this.roots) === isRoot);
        }

        // Confirm that all roots are minimal within their set (set1/set2).
        for (let root in this.roots) {
            let set = (root in set1) ? set1 : set2;
            for (let other in set) {
                console.assert(this.cmp(root, other) !== '>');
            }
        }

        // Confirm that before and after are consistent.
        for (let i = 0; i < this.inputArr.length; i++) {
            for (let j in (this.before[i] || {})) {
                console.assert(i in this.after[j]);
            }
            for (let j in (this.after[i] || {})) {
                console.assert(i in this.before[j]);
            }
        }
    }

    // Confirm that minSoFar is indeed minimal among all subtrees checked so
    // far. This is slow and should be turned off unless you're debugging.
    checkMinSoFarInvariant(minSoFar, rootsChecked) {
        for (let root in rootsChecked) {
            depthFirstTraverse(root, this.after, (node) => {
                console.assert(this.cmp(minSoFar, node) !== '>');
            });
        }
    }

    _call(inputArr, inputCmp, cmpCtx, arr) {

        this.inputArr = inputArr;
        this.inputCmp = inputCmp;

        if (arr === undefined) {
            // This is an initial call; we must initialize some values.
            arr         = inputArr.map((e, i) => i);
            this.cmpCtx = cmpCtx;
            this.cache  = {};
            this.after  = {inputArr};
            this.before = {};
            this.roots  = makeSet(arr);  // The set of roots.
            this.inputArr = inputArr;
            this.numCmpCalls = 0;
        }

        this.dbgStart(arr);

        // Define the base case.
        if (arr.length < 2) {
            this.dbgEndByBaseCase(arr);
            return {sorted: arr, inputArr: inputArr, before: this.before};
        }

        // Implement the recursive case.
        let k = Math.floor(arr.length / 2);
        let set1 = makeSet(arr.slice(0, k));
        let set2 = makeSet(arr.slice(k));
        sort(inputArr, inputCmp, cmpCtx, arr.slice(0, k));
        sort(inputArr, inputCmp, cmpCtx, arr.slice(k));
        let subsetToSort = makeSet(arr);

        let sorted = [];
        let arrRoots = makeSet(
            arrOfSet(this.roots).filter(root => root in subsetToSort)
        );

        if (logLevel >= 3) say('arrRoots = ' + arrOfSet(arrRoots).join(' '));

        while (setSize(arrRoots) > 0) {

            // XXX TODO: Calling makeSet() every time is inefficient.
            this.dbgStartOfLoop(arrRoots, makeSet(arr));
            this.confirmInvariants(set1, set2);

            // Choose minSoFar from the side with more unsorted elements in it.
            // This heuristic aims to reduce the number of comparison calls.

            let largerSet = (setSize(set1) > setSize(set2)) ? set1 : set2;
            let minSoFar  = pickInSets(arrRoots, largerSet);
            if (minSoFar === null) minSoFar = pickInSets(arrRoots);
            let minSet = (minSoFar in set1) ? set1 : set2;

            this.dbgReportMinSoFar(minSoFar);

            let rootsChecked = {};
            for (let root in arrRoots) {

                this.checkMinSoFarInvariant(minSoFar, rootsChecked);
                rootsChecked[root] = true;

                if (root === minSoFar) continue;
                if (root in minSet) {
                    this.dbgSkippingNode(root, minSet);
                    continue;
                }
                depthFirstTraverse(root, this.after, (node) => {
                    let c = this.cmp(minSoFar, node);
                    this.dbgFoundCmp(minSoFar, c, node);
                    if (c === '<') {
                        if (node === root) {
                            this.makeXBeforeY(minSoFar, root);
                            removeFromSet(arrRoots, root);
                        }
                        return 'skip';
                    }
                    if (c === '>') {
                        this.dbgSubnodeLess(node);
                        this.makeXBeforeY(node, minSoFar);
                        removeFromSet(arrRoots, minSoFar);
                        minSoFar = root;
                        minSet = (minSoFar in set1) ? set1 : set2;
                        return 'break';
                    }
                });
            }

            if (logLevel >= 2) say(`Pushing ${inputArr[minSoFar]} onto sorted`);
            sorted.push(minSoFar);
            delete minSet[minSoFar];
            removeFromSet(arrRoots, minSoFar);
            removeFromSet(subsetToSort, minSoFar);
            for (const newRoot in this.after[minSoFar]) {
                if (!(newRoot in subsetToSort)) continue;
                arrRoots[newRoot] = true;
            }
        }

        this.dbgEnd(sorted);

        return {
            sorted: sorted.map(i => inputArr[i]),
            inputArr: this.inputArr,
            before: this.before
        }
    }
}

export const sort = new Sorter();


// ______________________________________________________________________
// Helper functions for tests

let activeTest = null;

function check(bool) {
    if (!bool) {
        console.log(`${activeTest.name} failed`);
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


// ______________________________________________________________________
// Run the tests

if (typeof window === 'undefined') {
    if (true) {
        let allTests = [
            test1, test2, test3, test4, test5,
            test6, test7, test8];
        // allTests = [test8];  // XXX
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

