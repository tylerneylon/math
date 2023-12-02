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
// This function can operate on dags, not just on trees. It is safe to add or
// delete edges during traversal. Deleting edges results in deterministic
// behavior (no choices to be made). However, edges added during traversal may
// or may not be visited within the traversal itself; it's unspecified behavior.
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
    if (seen  === undefined) seen  = {};
    if (path  === undefined) path  = [root];
    if (allPaths !== true && toPrint !== true && root in seen) return;
    let visitRootOnly = (toPrint && root in seen);
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
// TODO:
// 1. It would be nice to rename `toPrint` to something more generic.
// 2. I suspect the handling of `path` can be slightly more elegant; there's no
//    need to include `node` in the path to `node` as well. (I think those two
//    ideas go together into once nice change; not verified).

// This expectds a single object that represents all the edges in a directed
// graph. Each key (property) is viewed as a node, and the values are viewed as
// the set of destination nodes from the key. This returns undefined if there
// are no cycles; otherwise it returns an array of nodes that form a cycle. Each
// node in this array is connected to the next, and the last is connected to the
// first. I believe this algorithm is efficient in terms of order of magnitude,
// although I have not tried to prove that.
function findGraphCycle(after) {
    let nodesToExplore = makeSet(Object.keys(after));
    let seen = {};  // Start as the empty set.
    let returnValue = undefined;
    while (returnValue === undefined && setSize(nodesToExplore) > 0) {
        let root = pickInSet(nodesToExplore);
        depthFirstTraverse(root, after, (node, _, __, path) => {
            let i = path.indexOf(node);
            if (0 <= i && i < path.length - 1) {
                returnValue = path.slice(i, path.length - 1);
                return 'break';
            }
            seen[root] = true;
            removeFromSet(nodesToExplore, node);
        }, undefined, {seen, toPrint: true});
    }
    return returnValue;
}

// This receives a dag (directed acyclic graph) and removes all edges x->y such
// that x~>y, meaning x can be reached by a longer path.
function transitiveReduce(roots, after, before) {
    for (let root of roots) {
        depthFirstTraverse(root, after, (node, depth, childNum, path) => {
            let elders = intersect(before[node], makeSet(path.slice(0, -2)));
            for (let elder in elders) {
                // These can be safely removed during traversal. This is because
                // the depth traversal iterates using a for .. in loop over the
                // children of each node, which the ecmascript spec guarantees
                // will work with mid-loop deletions. Reference:
                // https://262.ecma-international.org/5.1/#sec-12.6.4
                removeFromSet(after[elder], node);
                removeFromSet(before[node], elder);
            }
        });
    }
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

    // This ensures that x can reach y in the dag, and also performs incremental
    // transitive reduction on the graph.
    addXYandReduce(x, y) {
        this.makeXBeforeY(x, y);
        return;
        let xDesc = this.descendants[x] || {};
        if (y in xDesc) return;
        this.makeXBeforeY(x, y);
        let yDesc = structuredClone(this.descendants[y] || {});
        yDesc[y] = true;
        depthFirstTraverse(x, this.before, (node) => {
            if (node !== x) {
                for (const kid in intersect(this.after[node], yDesc)) {
                    // The edge node -> kid has become redundant.
                    // We must "take care" of the edge.
                    this.removeXYedge(node, kid);
                }
            }
            unionXintoY(yDesc, this.descendants[node] ??= {});
        });
    }

    // This "blindly" adds the edge x -> y, meaning that it does not care at all
    // about transitive reduction.
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

    dbgCycleCheck() {
        let cycle = findGraphCycle(this.after);
        if (cycle) say('Cycle found: ' + this.strOfArr(cycle));
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
                    `cmp(root (${rLabel}), other (${oLabel}, same set)) is ${c}`
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
                assert(
                    this.cmp(minSoFar, node) !== '>',
                    `got minSoFar(${minSoFar}) > checked root ${node}`
                );
            });
        }
    }

    _call(inputArr, inputCmp, cmpCtx, opts/* subsetArr */) {

        logLevel = logLevel || dbgCtx.logLevel;
        dMode    = dMode || dbgCtx.debugMode;

        this.inputArr = inputArr;
        this.inputCmp = inputCmp;

        let topLevelCall = (!opts || !opts.subsetArr);
        let subsetArr;
        let doRecursiveMode = true;

        if (!topLevelCall) {
            subsetArr = opts.subsetArr;
        } else {
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
            // Uncomment the next line to support the addXYandReduce() function.
            // this.descendants = {};  // Maps nodes to their desc'nt set.

            // Pre-emptively call cmp() on graph edges if we're given a dag.
            if (opts && opts.rootSet) {

                doRecursiveMode = false;

                // Compute a reverse index for opts.sortedIdx.
                let idx = {};
                for (let [k, v] of Object.entries(opts.sortedIdx)) {
                    idx[v] = k;
                }

                // console.log('start');  // XXX
                let numPredicted = 0;
                let numOpposite = 0;
                let numMissed = 0;
                for (let root of arrOfSet(opts.rootSet)) {
                    depthFirstTraverse(root, opts.after,
                            (node, _, __, path) => {
                        if (node === root) return;
                        // XXX
                        check(path[path.length - 1] === node);
                        let x = idx[path[path.length - 2]];
                        let y = idx[node];
                        let c = this.cmp(x, y);
                        if (c === '<') {
                            this.makeXBeforeY(x, y);
                            numPredicted++;
                        }
                        if (c === '>') {
                            this.makeXBeforeY(y, x);
                            numOpposite++;
                        }
                        if (c !== '<' && c !== '>') {
                            numMissed++;
                        }
                    }, undefined, {toPrint: true});
                }
                // console.log('Predicted:', numPredicted);
                // console.log('Opposite: ', numOpposite);
                // console.log('Missed:   ', numMissed);
                // console.log('done');  // XXX
            }
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
        if (doRecursiveMode) {
            sort(inputArr, inputCmp, cmpCtx, {subsetArr: subsetArr.slice(0, k)});
            sort(inputArr, inputCmp, cmpCtx, {subsetArr: subsetArr.slice(k)});
        }
        let subsetToSort = makeSet(subsetArr);

        let sorted = [];
        let subsetRootsToSort = makeSet(
            arrOfSet(this.roots).filter(root => root in subsetToSort)
        );

        if (logLevel >= 3 && dMode) {
            say('subsetRootsToSort = ' + arrOfSet(subsetRootsToSort).join(' '));
        }

        // Choose minSoFar from the side with more unsorted elements in it.
        // This heuristic aims to reduce the number of comparison calls.

        let largerSet = (setSize(set1) > setSize(set2)) ? set1 : set2;
        let minSoFar  = pickInSets(subsetRootsToSort, largerSet);
        if (!doRecursiveMode) minSoFar = pickInSets(subsetRootsToSort);
        if (minSoFar === null) minSoFar = pickInSets(subsetRootsToSort);
        let minSet = (minSoFar in set1) ? set1 : set2;
        let rootsChecked = {};

        if (dMode) this.dbgReportMinSoFar(minSoFar);

        while (setSize(subsetRootsToSort) > 0) {

            if (dMode) {
                this.dbgStartOfLoop(subsetRootsToSort, makeSet(subsetArr));
                if (doRecursiveMode) {
                    this.confirmInvariants(subsetRootsToSort, set1, set2);
                }
            }

            let doAnotherCheck = false;
            let seen = {};
            for (let root in subsetRootsToSort) {
                if (dMode) {
                    this.checkMinSoFarInvariant(
                        minSoFar, rootsChecked, set1, set2
                    );
                    rootsChecked[root] = true;
                }
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
                    if (c === '<') {  // minSoFar < node
                        this.makeXBeforeY(minSoFar, node);
                        removeFromSet(subsetRootsToSort, node);
                        return 'skip';
                    }
                    if (c === '>') {  // minSoFar > node
                        if (dMode) this.dbgSubnodeLess(node);
                        this.makeXBeforeY(node, minSoFar);
                        removeFromSet(subsetRootsToSort, minSoFar);
                        minSoFar = root;
                        minSet = (minSoFar in set1) ? set1 : set2;
                        if (dMode) rootsChecked = {};
                        doAnotherCheck = true;
                        return 'break';
                    }
                }, null, {seen});
                if (doAnotherCheck) break;
            }

            if (!doAnotherCheck) {
                if (dMode) this.dbgPushing(minSoFar);
                sorted.push(Number(minSoFar));
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
                largerSet = (setSize(set1) > setSize(set2)) ? set1 : set2;
                minSoFar  = pickInSets(subsetRootsToSort, largerSet);
                if (minSoFar === null || !doRecursiveMode) {
                    minSoFar = pickInSets(subsetRootsToSort);
                }
                minSet = (minSoFar in set1) ? set1 : set2;
                if (dMode) rootsChecked = {};
            }
        }

        // XXX DEBUG3 I'm checking to see how much this may help / not help.
        // TODO: Move this to happen at the start, rather than at the end. My
        // reasoning is that, if this is a one-off sort call, then there's no
        // value in applying a transitive reduction. So what we want is either
        // to have a one-off sort that skips reduction, or to perform reduction
        // only between subsequent calls.
        if (topLevelCall) {
            transitiveReduce(arrOfSet(this.roots), this.after, this.before);
        }

        if (dMode) this.dbgCycleCheck();

        if (sorted.length < subsetArr.length) {
            console.warn('WARNING: It looks like a cycle was present ' +
                         'in the order sent to sort().');
            // This is not great, but we'll just arbitrarily add in elements
            // until sorted contains the full input list.
            // This is not efficient but also should not normally happen at all.
            for (let item of subsetArr) {
                item = Number(item);
                if (sorted.indexOf(item) === -1) sorted.push(item);
            }
        }

        if (dMode) this.dbgEnd(sorted, makeSet(subsetArr));

        return {
            sorted:    sorted.map(i => inputArr[i]),
            sortedIdx: sorted,
            inputArr:  this.inputArr,
            after:     this.after,
            before:    this.before,
            rootSet:   this.roots
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

function checkArraysAreSame(arr1, arr2, msg) {
    check(
        arr1.length === arr2.length,
        `different array lengths: ${arr1.length} vs ${arr2.length}`
    );
    for (let i = 0; i < arr1.length; i++) {
        check(
            arr1[i] === arr2[i],
            `different array values: ${arr1} vs ${arr2}`
        );
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

function checkSetsAreEqual(set1, set2, msg) {
    msg = msg || '';
    msg = `${msg} set1=${arrOfSet(set1)} set2=${arrOfSet(set2)}`;
    let arr1 = arrOfSet(set1);
    let arr2 = arrOfSet(set2);
    check(arr1.length === arr2.length, msg);
    for (let item of arr1) check(item in set2, msg);
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
// Helper functions to make graphs

// These accept and return objects of the form {roots, after, before}.
// The nodes are the integers 1 through n.

function makeEmptyGraph(numNodes) {
    let roots = makeSet([...Array(numNodes).keys()].map(x => x + 1));
    return {roots, after: {}, before: {}};
}

function addEdge(graph, from, to) {
    pushToSet(graph.after, from, to);
    pushToSet(graph.before, to, from);
    removeFromSet(graph.roots, to);
}

function checkGraphsMatch(graph1, graph2) {
    checkSetsAreEqual(graph1.roots, graph2.roots, 'root set equality');
    checkSetsAreEqual(graph1.after, graph2.after, 'after src set equality');
    checkSetsAreEqual(graph1.before, graph2.before, 'before src set equality');
    for (let key in graph1.after) {
        checkSetsAreEqual(
            graph1.after[key],
            graph2.after[key],
            `after[${key}] equality`
        );
    }
    for (let key in graph1.before) {
        let msg = `before[${key}] equality`;
        checkSetsAreEqual(graph1.before[key], graph2.before[key], msg);
    }
}

function makeGraphFromEdges(numNodes, edges) {
    let dag = makeEmptyGraph(numNodes);
    for (let edge of edges) addEdge(dag, edge[0], edge[1]);
    return dag;
}


// ______________________________________________________________________
// Tests for transitive reduction

// This is a test of transitiveReduce().
// This is a simple case with 1 -> 2 -> 3 and 1 -> 3.
// We want only edge 1 -> 3 to be pruned.
// Use printForest(roots, dag.after) before/after the t.r. call to help debug.
function trTest1() {

    let dag = makeEmptyGraph(3);
    addEdge(dag, 1, 2);
    addEdge(dag, 1, 3);
    addEdge(dag, 2, 3);

    let {roots, after, before} = dag;
    roots = arrOfSet(roots);
    transitiveReduce(roots, after, before);

    // Build the target dag.
    let targetDag = makeEmptyGraph(3);
    addEdge(targetDag, 1, 2);
    addEdge(targetDag, 2, 3);

    checkGraphsMatch(dag, targetDag);
}

// This is a test of transitiveReduce().
// This begins on this dag:
// 1 - 2 - 4 - 5 - 6
//           \ 6
//   \ 3 - 4
//   \ 4
// The edges 1->4 and 4->6 should be removed.
// Use printForest(roots, dag.after) before/after the t.r. call to help debug.
function trTest2() {

    let edges = [
        [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 5], [4, 6], [5, 6]
    ];
    let dag = makeGraphFromEdges(6, edges);

    let {roots, after, before} = dag;
    roots = arrOfSet(roots);
    transitiveReduce(roots, after, before);

    edges = [
        [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6]
    ];
    let targetDag = makeGraphFromEdges(6, edges);

    checkGraphsMatch(dag, targetDag);
}

// This is a test of transitiveReduce().
// This begins on this dag:
// 1 - 2 - 3  |  4 - 5 - 6
//   \ 3      |    \ 6
// The edges 1->4 and 4->6 should be removed.
// Use printForest(roots, dag.after) before/after the t.r. call to help debug.
function trTest3() {

    let edges = [
        [1, 2], [2, 3], [1, 3], [4, 5], [5, 6], [4, 6]
    ];
    let dag = makeGraphFromEdges(6, edges);

    let {roots, after, before} = dag;
    roots = arrOfSet(roots);
    transitiveReduce(roots, after, before);

    edges = [
        [1, 2], [2, 3], [4, 5], [5, 6]
    ];
    let targetDag = makeGraphFromEdges(6, edges);

    checkGraphsMatch(dag, targetDag);
}


// ______________________________________________________________________
// Tests for findGraphCycle()

// Test the simple cycle: 1 - 2 - 3 - 1
function cycleTest1() {
    let edges = [[1, 2], [2, 3], [3, 1]];
    let graph = makeGraphFromEdges(3, edges);
    let result = findGraphCycle(graph.after);
    checkArraysAreSame(result, [1, 2, 3].map(x => `${x}`));
}

// Test a graph with no cycles.
function cycleTest2() {
    let edges = [[1, 2], [2, 3], [1, 3]];
    let graph = makeGraphFromEdges(3, edges);
    let result = findGraphCycle(graph.after);
    check(result === undefined, 'there are no cycles in this graph');
}

// Test the graph:  1 - 2 - 3 - 4 - 1
function cycleTest3() {
    let edges = [[1, 2], [2, 3], [3, 4], [4, 1]];
    let graph = makeGraphFromEdges(4, edges);
    let result = findGraphCycle(graph.after);
    checkArraysAreSame(result, [1, 2, 3, 4].map(x => `${x}`));
}

// Test this graph:
// 1 - 2 - 3 - 7 - 6 - 2  |  4 - 5 - 6
function cycleTest4() {
    let edges = [
        [1, 2], [2, 3], [4, 5], [5, 6],
        [3, 7], [7, 6], [6, 2]
    ];
    let graph = makeGraphFromEdges(7, edges);
    let result = findGraphCycle(graph.after);
    checkArraysAreSame(result, [2, 3, 7, 6].map(x => `${x}`));
}

// Test this slightly complicated graph:
//  1 - 2 - 4  |  3 - 4  |  5 - 6 -  7 -  8
//             |         |             \  9 - 11 - 6
//             |         |        \  8
//             |         |        \ 10 - 11
function cycleTest5() {
    let edges = [
        [1, 2], [2, 4], [3, 4],
        [5, 6], [6, 7], [6, 8], [6, 10], [7, 8], [7, 9],
        [9, 11], [10, 11], [11, 6]
    ];
    let graph = makeGraphFromEdges(11, edges);
    let result = findGraphCycle(graph.after);
    // Note that other cycles are also valid. This just happens to be the one
    // that the current implementation returns first.
    checkArraysAreSame(result, [6, 7, 9, 11].map(x => `${x}`));
}

// Test the simple graph 1 <-> 2
function cycleTest6() {
    let edges = [[1, 2], [2, 1]];
    let graph = makeGraphFromEdges(2, edges);
    let result = findGraphCycle(graph.after);
    checkArraysAreSame(result, [1, 2].map(x => `${x}`));
}

// Test the simple case of a node connected to itself.
function cycleTest7() {
    let edges = [[1, 1]];
    let graph = makeGraphFromEdges(1, edges);
    let result = findGraphCycle(graph.after);
    checkArraysAreSame(result, [1].map(x => `${x}`));
}


// ______________________________________________________________________
// Tests for depth traversal

// TODO: Keep or drop these. Not yet integrated below; and no checks.

function depthTraverseTest1() {
    let edges = [[1, 2], [2, 3], [3, 1]];
    let graph = makeGraphFromEdges(3, edges);
    depthFirstTraverse(1, graph.after, (node) => {
        console.log(`visited node ${node}`);
    });
}

function depthTraverseTest2() {
    let edges = [[1, 2], [2, 3], [3, 4], [4, 1]];
    let graph = makeGraphFromEdges(4, edges);
    depthFirstTraverse(1, graph.after, (node) => {
        console.log(`visited node ${node}`);
    });
}

//  1 - 2 - 4  |  3 - 4  |  5 - 6 -  7 -  8
//             |         |             \  9 - 11 - 6
//             |         |        \  8
//             |         |        \ 10 - 11
function depthTraverseTest3() {
    let edges = [
        [1, 2], [2, 4], [3, 4],
        [5, 6], [6, 7], [6, 8], [6, 10], [7, 8], [7, 9],
        [9, 11], [10, 11], [11, 6]
    ];
    let graph = makeGraphFromEdges(11, edges);
    depthFirstTraverse(5, graph.after, (node) => {
        console.log(`visited node ${node}`);
    });
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

function runTests() {
    dMode = true;
    logLevel = 3;

    // This is `false` by default, running all unit tests.
    // Set this to true to focus on a single test in the immediately following
    // focus block.
    let focusMode = false;

    // A place to focus on a single unit test at a time.
    if (focusMode) {
        activeTest = depthTraverseTest3;
        activeTest();
        console.log('Passed!');
    }

    if (!focusMode) {
        let allTests = [
            test1, test2, test3, test4, test5,
            test6, test7, test8,
            trTest1, trTest2, trTest3,
            cycleTest1, cycleTest2, cycleTest3, cycleTest4,
            cycleTest5, cycleTest6, cycleTest7
        ];
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

if (typeof window === 'undefined') {
    let runFile  = process.argv[1].split('/').slice(-1)[0];
    let thisFile = import.meta.url.split('/').slice(-1)[0];
    if (runFile === thisFile) runTests();
}    

