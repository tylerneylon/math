/* sort.js
 *
 * Sorting with partial information.
 *
 * This file contains a function which can sort a given array by
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
// Debug functions

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

// TODO: Either drop this or combine with getRowsFromColumsn().
function showTableWithColumns(cols, topSep, midSep, printFn) {

    if (topSep === undefined) topSep = ' ';
    if (midSep === undefined) midSep = ' ';
    if (printFn === undefined) printFn = say;

    // Convert each cell to a string as needed.
    cols = cols.map(col => col.map(x => x + ''));

    let numRows = Math.max(...cols.map(x => x.length));
    cols.forEach(col => {
        while (col.length < numRows) col.push('');
    });

    // Find the maximum width in each column.
    let widths = cols.map(col => Math.max(...col.map(x => x.length)));
    // say('widths: ' + widths.join(', ')); // XXX

    let nonTopSep = ''.padEnd(topSep.length);
    // say(`nonTopSet="${nonTopSep}"`);  // XXX
    for (let i = 0; i < numRows; i++) {
        let sep = (i === 0) ? topSep : nonTopSep;
        let msg = cols.map((col, j) => col[i].padEnd(widths[j])).join(sep);
        printFn(msg.replaceAll(' ', midSep));
    }
}

// TODO: Consider adding support for 'break' to be returned by fn1().
//       In order to support that, I think I'd need to replace the .forEach().

// Run fn1() and fn2() on each node of the given tree in depth-first order.
// Each call is of the form fn(node, depth, childNum).
// For the root, `childNum` is undefined.
// Otherwise, `childNum` is the index of this node as a child of its parent.
// fn1() is called before its children, fn2() after.
// If fn1(node) returns 'skip', then all the children of `node` are skipped.
function depthFirstTraverse(root, tree, fn1, fn2, opts) {
    let {depth, childNum, nodeSet} = opts || {};
    if (depth === undefined) depth = 0;
    // console.log(`dFTraverse; depth:${depth}, childNum:${childNum}, nodeSet:${nodeSet}`);
    if (fn1(root, depth, childNum) !== 'skip') {
        tree[root]?.forEach((node, i) => {
            if (nodeSet === undefined || (node in nodeSet)) {
                depthFirstTraverse(node, tree, fn1, fn2,
                    {depth: depth + 1, childNum: i, nodeSet});
            }
        });
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
    // XXX and below within this fn
    // console.log('getTree()')
    // console.log('root:', root);
    // console.log('tree:', tree);
    //console.log('nodeSet:', nodeSet);
    depthFirstTraverse(root, tree, (node, depth, childNum) => {
        // console.log(`called: fn1(${node}, ${depth}, ${childNum})`);
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
        // console.log(`called: fn2(${node}, ${depth})`);
        for (let i = 2 * depth - 1; i <= 2 * depth; i++) {
            while (i > 0 && cols[i].length < numRows) cols[i].push('');
        }
    }, {nodeSet});
    // console.log('end of getTree()');
    // TODO: Modify showTable..() to accept an `opts` value instead.
    // showTableWithColumns(cols, ' ', ' ', console.log);
    return getRowsFromColumns(cols);
}

function printForest(roots, tree, nodeSet) {
    let cols = roots.map(root => getTree(root, tree, nodeSet));
    say(getRowsFromColumns(cols, '  |  '));
}


// ______________________________________________________________________
// Main function

// This will sort the values in `inputArr` according to the comparison data
// provided by calls to `inputCmp()`, which is expected to return the values '='
// (a string), '<', '>', or null; where a null indicates that the comparison
// value is undetermined; undetermined pairs either have an order based on the
// transitive closure of other pairs, or - if not - they may go in any order.
// This function attempts to reduce the number of calls to inputCmp() in several
// ways:
//  * It memorizes each return value of inputCmp() that it sees.
//  * It assumes that if a < b then also b > a (otherwise what is happening?).
//  * It builds a tree to infer transitive comparisons, and tries to maximize
//    the use of that tree.
function sortWithPartialInfo1(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    console.log('Start sortWithPartialInfo1()');
    let numCmpCalls = 0;

    // 1. Set up memoization for inputCmp().

    // This serves to both memorize results as well as to allow us to treat the
    // input as an array of integers, although inputArr may have any types.
    const cache = {};
    function cmp(a, b) {
        let key = a + ':' + b;
        let val = cache[key];
        if (val !== undefined) return val;

        // let result = (a === b) ? '=' : inputCmp(inputArr[a], inputArr[b], ctx);
 
        // XXX DEBUG1 (replace with the above line)
        let result;
        if (a === b) {
            result = '=';
        } else {
            numCmpCalls++;
            result = inputCmp(inputArr[a], inputArr[b], ctx);
        }
    
        cache[key] = result;

        let otherKey = b + ':' + a;
        let otherResult = result;
        if (result === '<') otherResult = '>';
        if (result === '>') otherResult = '<';
        cache[otherKey] = otherResult;

        return result;
    }

    // 2. Sort `arr`, using the memoized comparison function cmp().

    let arr     = inputArr.map((e, i) => i);
    let sorted  = [];
    let min     = arr[arr.length - 1];
    let cmpTree = {[min]: []}

    say('<p><hr>Beginning to sort<br>');
    say(`Candidate min = ${inputArr[min]}`);

    let getName = x => inputArr[x];
    function printCmpTree(min, cmpTree) {
        let y = min;
        let cols = [[getName(y)]];
        while (y !== undefined) {
            if (y in cmpTree) {
                cols.push(cmpTree[y].map(getName));
                y = cmpTree[y][0];
            } else {
                break;
            }
        }
        say('cmpTree:');
        showTableWithColumns(cols.slice(0, cols.length - 1), ' < ');
    }

    while (arr.length > 0) {

        let xIdx = arr.length;
        while (true) {

            xIdx--;
            if (xIdx === -1) {
                let n = inputArr[min];
                say(`<span class="framed">Adding item ${n}</span>`);
                sorted.push(min);
                arr.splice(arr.indexOf(min), 1);
                for (let i = 1; i < cmpTree[min].length; i++) {
                    delete cmpTree[cmpTree[min][i]];
                }
                min = cmpTree[min][0];
                // If the order is not fully determined, cmpTree could be empty
                // yet we may still have elements left in arr.
                if (min === undefined && arr.length > 0) {
                    min = arr[arr.length - 1];
                    cmpTree[min] = [];
                }
                if (min !== undefined) {
                    let n = inputArr[min];  // XXX
                    say(`Candidate min = ${n}`);
                    printCmpTree(min, cmpTree);
                }
                break;
            }

            let x = arr[xIdx];
            let n = inputArr[x];  // XXX
            if (x in cmpTree) {
                let minName = inputArr[min];
                say(`Keeping the min (${minName}) < ${n} as n is in the cmpTree`);
                continue;
            }
            indent();
            let c = cmp(x, min);
            dedent();
            if (c === '>') {
                say(`Keeping the min < ${n} as indicated by cmp`);
                cmpTree[min].push(x);
                cmpTree[x] = [];
            } 
            if (c === '<') {
                // say(`It looks like ${n} is smaller`);
                say(`New candidate min = ${n}`);
                cmpTree[x] = [min];
                min  = x;
                xIdx = arr.length;
                printCmpTree(min, cmpTree);
            }
        }
    }

    // DEBUG1
    // Find the chains in `arr`.
    let chainLens = [];
    let thisChain = 1;
    sorted.forEach((elt, i) => {
        if (i === sorted.length - 1) return;
        if (cmp(elt, sorted[i + 1]) === '<') {
            thisChain++;
        } else {
            chainLens.push(thisChain);
            thisChain = 1;
        }
    });
    console.log('Chain lengths in sorted:');
    console.log(chainLens.join(', '));

    // DEBUG1
    console.log(`numCmpCalls = ${numCmpCalls}`);
    console.log('End sortWithPartialInfo()');

    return sorted.map(i => inputArr[i]);
}

function push(elt, prop, newItem) {
    if (!elt.hasOwnProperty(prop)) elt[prop] = [];
    elt[prop].push(newItem);
}

let logLevel = 3;

function sortWithPartialInfo2(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    if (logLevel >= 1) console.log('Start sortWithPartialInfo2()');
    let numCmpCalls = 0;

    // 1. Set up memoization for inputCmp().

    // This serves to both memorize results as well as to allow us to treat the
    // input as an array of integers, although inputArr may have any types.
    const cache = {};
    function cmp(a, b) {
        let key = a + ':' + b;
        let val = cache[key];
        if (val !== undefined) return val;

        // let result = (a === b) ? '=' : inputCmp(inputArr[a], inputArr[b], ctx);
 
        // XXX DEBUG1 (replace with the above line)
        let result;
        if (a === b) {
            result = '=';
        } else {
            numCmpCalls++;
            result = inputCmp(inputArr[a], inputArr[b], ctx);
        }
    
        cache[key] = result;

        let otherKey = b + ':' + a;
        let otherResult = result;
        if (result === '<') otherResult = '>';
        if (result === '>') otherResult = '<';
        cache[otherKey] = otherResult;

        return result;
    }

    // 2. Sort `arr`, using the memoized comparison function cmp().

    let arr     = inputArr.map((e, i) => i);
    let sorted  = [];

    // ______________________________________________________________________
    // Start of the main stuff.

    // We'll build a forest to track known comparisons.
    //  * after[item]  = <array of items larger than `item`>
    //  * before[item] = <single most-recent item less than `item`>
    // I'll use a sentinel object 'enoch' (the string) which
    // is less than everything; its purpose is to point to the
    // roots of all trees in the forest.
    let after  = {enoch: arr}
    let before = {};
    let roots  = after.enoch;

    // TODO: Performance is not good when the list is pre-sorted
    //       and cmp() is a total order. Can we use an approach closer
    //       to mergesort to improve that case?

    while (roots.length > 0) {

        if (logLevel >= 2) {
            console.log(`Start of loop: roots has length ${roots.length}`);

            // Print out the full forest.
            console.log('Forest:');
            console.log('_'.repeat(30));
            printForest(roots, after);
            console.log('_'.repeat(30));
        }

        let minSoFarIdx = 0;
        let minSoFar    = roots[minSoFarIdx];

        for (let i = 0; i < roots.length; i++) {
            let root = roots[i];
            if (root === minSoFar) continue;
            let c = cmp(minSoFar, root);
            if (c === '<') {
                push(after, minSoFar, root);
                before[root] = minSoFar;
                roots.splice(i, 1);
                if (i < minSoFarIdx) minSoFarIdx--;
                i--;
            } else if (c === '>') {
                push(after, root, minSoFar);
                before[minSoFar] = root;
                roots.splice(minSoFarIdx, 1);
                minSoFar = root;
                minSoFarIdx = (i > minSoFarIdx) ? i - 1 : i;
                i = -1;
            }
        }

        if (logLevel >= 2) console.log(`Pushing ${minSoFar} onto sorted`);
        sorted.push(minSoFar);
        roots.splice(roots.indexOf(minSoFar), 1);
        after[minSoFar]?.forEach(newRoot => {
            roots.push(newRoot)
        });
    }

    // End of the main stuff.
    // ______________________________________________________________________

    // DEBUG1
    if (logLevel >= 1) {
        console.log(`numCmpCalls = ${numCmpCalls}`);
        console.log('End sortWithPartialInfo2()');
    }

    return sorted.map(i => inputArr[i]);
}

function makeSet(arr) {
    let set = {};
    arr.forEach(elt => {set[elt] = true;});
    return set;
}

// This is a function that returns a sorted version of inputArr based on the
// partial comparison information from inputCmp().
// The values in `opts` are only intended for internal use, but I'll describe
// them here as well.
// If opts.arr exists, that input is used alone instead of inputArr.
// There is a global forest kept by using these values:
//   opts.after   opts.before   opts.roots
// TODO: Rename appropriately.
function sortV3(inputArr, inputCmp, opts) {

    if (opts === undefined) opts = {};

    // Receive the pass-through arguments in `opts`.
    let arr    = opts.arr || inputArr.map((e, i) => i);
    let cache  = opts.cache || {};
    let after  = opts.after  || {inputArr};
    let before = opts.before || {};
    let roots  = opts.roots  || structuredClone(arr);
    let numCmpCalls = opts.numCmpCalls || 0; 
    Object.assign(opts, {arr, cache, after, before, roots, numCmpCalls});

    function strOfArr(arr) {
        return arr.map(x => inputArr[x]).join(' ');
    }

    if (logLevel >= 1) {
        say('Start sortV3() with arr: ' + strOfArr(arr));
        indent();
    }

    // Define the cmp wrapper function that uses the cache.
    function cmp(a, b) {
        let key = a + ':' + b;
        let val = cache[key];
        if (val !== undefined) return val;

        // let result = (a === b) ? '=' : inputCmp(inputArr[a], inputArr[b], ctx);
 
        // XXX DEBUG1 (replace with the above line)
        let result;
        if (a === b) {
            result = '=';
        } else {
            opts.numCmpCalls++;
            result = inputCmp(inputArr[a], inputArr[b]);
        }
    
        cache[key] = result;

        let otherKey = b + ':' + a;
        let otherResult = result;
        if (result === '<') otherResult = '>';
        if (result === '>') otherResult = '<';
        cache[otherKey] = otherResult;

        return result;
    }

    // Define the base case.
    if (arr.length < 2) {
        if (logLevel >= 1) {
            say(`numCmpCalls = ${opts.numCmpCalls}`);
            dedent();
            say('End sortV3(); returning ' + strOfArr(arr));
        }
        return arr;
    }

    // Implement the recursive case.
    let optsWith = x => Object.assign(opts, x);
    let k = Math.floor(arr.length / 2);
    let side1 = arr.slice(0, k);
    sortV3(inputArr, inputCmp, optsWith({arr: arr.slice(0, k)}));
    let side2 = arr.slice(k);
    sortV3(inputArr, inputCmp, optsWith({arr: arr.slice(k)}));
    let set1 = makeSet(side1);
    let set2 = makeSet(side2);
    let arrSet = makeSet(arr);  // TODO: Needed?

    let sorted = [];
    let arrRoots = roots.filter(root => root in arrSet);

    if (logLevel >= 3) {
        say('arrRoots = ' + arrRoots.join(' '));
    }

    while (arrRoots.length > 0) {

        if (logLevel >= 3) {
            say('roots forest:');
            say('_'.repeat(30));
            printForest(roots, after);
            say('_'.repeat(30));
        }

        if (logLevel >= 2) {
            say(
                `Start of loop: arrRoots has length ${arrRoots.length}: ` + 
                `[${arrRoots.map(x => inputArr[x]).join(' ')}]`
            );

            // Print out the full forest.
            say('arrRoots Forest:');
            say('_'.repeat(30));
            printForest(arrRoots, after, arrSet);
            say('_'.repeat(30));
        }

        // Choose minSoFar from the side with more (unsorted) elements in it.
        // This is a heuristic to help reduce the number of comparison calls.

        let len1 = Object.keys(set1).length;
        let len2 = Object.keys(set2).length;
        let largerSet = (len1 > len2) ? set1 : set2;
        let largerSideRootIndexes = Object.keys(arrRoots).filter(
            x => arrRoots[x] in largerSet
        );
        let minSoFarIdx = largerSideRootIndexes[0] ?? 0;
        let minSoFar    = arrRoots[minSoFarIdx];
        let minSet      = (minSoFar in set1) ? set1 : set2;

        if (logLevel >= 3) {
            say(`Trying out minSoFar:${inputArr[minSoFar]}; idx:${minSoFarIdx}`);
        }

        for (let i = 0; i < arrRoots.length; i++) {
            let root = arrRoots[i];
            if (root === minSoFar) continue;
            if (root in minSet) {
                if (logLevel >= 3) {
                    say(`Skipping cmp w ${inputArr[root]} since it is in the minSet: ` +
                        strOfArr(Object.keys(minSet))
                    );
                }
                continue;
            }
            let c = cmp(minSoFar, root);
            if (logLevel >= 3) {
                say(`Found that ${inputArr[minSoFar]} ${c} ${inputArr[root]}`);
            }

            // XXX Move this definition.
            function makeXBeforeY(x, y) {
                push(after, x, y);
                if (y in before) {
                    let oldPeers = after[before[y]];
                    oldPeers.splice(oldPeers.indexOf(y), 1);
                }
                before[y] = x;
                let rootIdx = roots.indexOf(y);
                if (rootIdx !== -1) roots.splice(rootIdx, 1);
            }

            if (c === '<') {
                // XXX
                // say('A roots = ' + (roots.join(' ')));
                // say(`Dropping the root ${root}`);
                makeXBeforeY(minSoFar, root);
                arrRoots.splice(i, 1);
                // roots.splice(roots.indexOf(root), 1);  // XXX speed this up
                // say('B roots = ' + (roots.join(' ')));
                if (i < minSoFarIdx) minSoFarIdx--;
                i--;
            } else if (c === '>') {
                makeXBeforeY(root, minSoFar);
                arrRoots.splice(minSoFarIdx, 1);
                // roots.splice(roots.indexOf(minSoFar), 1);  // XXX speed this up
                minSoFar = root;
                minSoFarIdx = (i > minSoFarIdx) ? i - 1 : i;
                minSet = (minSoFar in set1) ? set1 : set2;
                i = -1;
            } else {
                console.assert(c === null);
                // Walk the tree in case x < minSoFar for some x in the tree.
                let rootIsSmaller = false;
                depthFirstTraverse(root, after, (node) => {
                    if (rootIsSmaller) return 'skip';
                    let c = cmp(minSoFar, node);
                    if (c === '<') return 'skip';
                    if (c === '>') {
                        if (logLevel >= 2) {
                            say(`Found a sub-node (${inputArr[node]}) < minSoFar`);
                        }
                        makeXBeforeY(node, minSoFar);
                        arrRoots.splice(minSoFarIdx, 1);
                        minSoFar = root;
                        minSoFarIdx = (i > minSoFarIdx) ? i - 1 : 1;
                        minSet = (minSoFar in set1) ? set1 : set2;
                        i = -1;
                        rootIsSmaller = true;
                    }
                });
                if (!rootIsSmaller && logLevel >= 2) {
                    say(`No sub-nodes (of ${inputArr[root]}) were smaller`);
                }
            }
        }

        if (logLevel >= 2) say(`Pushing ${inputArr[minSoFar]} onto sorted`);
        sorted.push(minSoFar);
        delete minSet[minSoFar];
        // roots.splice(roots.indexOf(minSoFar), 1);  // XXX
        arrRoots.splice(arrRoots.indexOf(minSoFar), 1);  // XXX
        after[minSoFar]?.forEach(newRoot => {
            // roots.push(newRoot);
            if (newRoot in arrSet) arrRoots.push(newRoot);
        });
    }

    if (logLevel >= 1) {
        say(`numCmpCalls = ${opts.numCmpCalls}`);
        dedent();
        say('End sortV3(); returning ' + strOfArr(sorted));
    }

    return sorted.map(i => inputArr[i]);
}

function sortWithPartialInfo3(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    if (logLevel >= 1) console.log('Start sortWithPartialInfo3()');
    let numCmpCalls = 0;

    // 1. Set up memoization for inputCmp().

    // This serves to both memorize results as well as to allow us to treat the
    // input as an array of integers, although inputArr may have any types.
    const cache = {};
    function cmp(a, b) {
        let key = a + ':' + b;
        let val = cache[key];
        if (val !== undefined) return val;

        // let result = (a === b) ? '=' : inputCmp(inputArr[a], inputArr[b], ctx);
 
        // XXX DEBUG1 (replace with the above line)
        let result;
        if (a === b) {
            result = '=';
        } else {
            numCmpCalls++;
            result = inputCmp(inputArr[a], inputArr[b], ctx);
        }
    
        cache[key] = result;

        let otherKey = b + ':' + a;
        let otherResult = result;
        if (result === '<') otherResult = '>';
        if (result === '>') otherResult = '<';
        cache[otherKey] = otherResult;

        return result;
    }

    // 2. Sort `arr`, using the memoized comparison function cmp().

    let arr     = inputArr.map((e, i) => i);
    let sorted  = [];

    // ______________________________________________________________________
    // Start of the main stuff.

    // We'll build a forest to track known comparisons.
    //  * after[item]  = <array of items larger than `item`>
    //  * before[item] = <single most-recent item less than `item`>
    // I'll use a sentinel object 'enoch' (the string) which
    // is less than everything; its purpose is to point to the
    // roots of all trees in the forest.
    let after  = {enoch: arr}
    let before = {};
    let roots  = after.enoch;

    // TODO: Performance is not good when the list is pre-sorted
    //       and cmp() is a total order. Can we use an approach closer
    //       to mergesort to improve that case?

    while (roots.length > 0) {

        if (logLevel >= 2) {
            console.log(`Start of loop: roots has length ${roots.length}`);

            // Print out the full forest.
            console.log('Forest:');
            console.log('_'.repeat(30));
            printForest(roots, after);
            console.log('_'.repeat(30));
        }

        let minSoFarIdx = 0;
        let minSoFar    = roots[minSoFarIdx];

        for (let i = 0; i < roots.length; i++) {
            let root = roots[i];
            if (root === minSoFar) continue;
            let c = cmp(minSoFar, root);
            if (c === '<') {
                push(after, minSoFar, root);
                before[root] = minSoFar;
                roots.splice(i, 1);
                if (i < minSoFarIdx) minSoFarIdx--;
                i--;
            } else if (c === '>') {
                push(after, root, minSoFar);
                before[minSoFar] = root;
                roots.splice(minSoFarIdx, 1);
                minSoFar = root;
                minSoFarIdx = (i > minSoFarIdx) ? i - 1 : i;
                i = -1;
            }
        }

        if (logLevel >= 2) console.log(`Pushing ${minSoFar} onto sorted`);
        sorted.push(minSoFar);
        roots.splice(roots.indexOf(minSoFar), 1);
        after[minSoFar]?.forEach(newRoot => {
            roots.push(newRoot)
        });
    }

    // End of the main stuff.
    // ______________________________________________________________________

    // DEBUG1
    if (logLevel >= 1) {
        console.log(`numCmpCalls = ${numCmpCalls}`);
        console.log('End sortWithPartialInfo3()');
    }

    return sorted.map(i => inputArr[i]);
}


// ______________________________________________________________________
// Tests definitions

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

// TODO: needed?
function checkArrayIsInAcceptableArrays(arr, acceptables) {
    let didFindMatch = false;
    acceptables.forEach(goalArr => {
        if (goalArr.filter((elt, i) => elt === arr[i]).length === arr.length) {
            didFindMatch = true;
        }
    });
    if (!didFindMatch) {
        console.log(`${activeTest.name} failed`);
        process.exit(1);
    }
}

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
    let result = sortV3(arr, cmp);
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
    let result = sortV3(arr, cmp);
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
    let result = sortV3(arr, cmp);
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
    let result = sortV3(arr, cmp);
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
    let result = sortV3(arr, cmp);
    console.log('result:');
    console.log(result);
    checkArrayRespectsKnownOrders(
        result,
        [[-4, -3, -2, -1], [1, 2, 3, 4]]
    );
}


// ______________________________________________________________________
// Run the tests

if (true) {
    // XXX
    // allTests = [test1, test2, test3, test4, test5];
    allTests = [test6];
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
