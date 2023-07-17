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
let prefix = '';

function indent() {
    prefix = prefix + spaceChar.repeat(4);
}

function dedent() {
    prefix = prefix.substr(4 * spaceChar.length);
}

function say(s) {
}

function showTableWithColumns(cols, topSep) {

    // Convert each cell to a string as needed.
    cols = cols.map(col => col.map(x => x + ''));

    let numRows = Math.max(...cols.map(x => x.length));
    cols.forEach(col => {
        while (col.length < numRows) col.push('');
    });

    // Find the maximum width in each column.
    let widths = cols.map(col => Math.max(...col.map(x => x.length)));
    // say('widths: ' + widths.join(', ')); // XXX

    let nonTopSep = ''.padStart(topSep.length);
    // say(`nonTopSet="${nonTopSep}"`);  // XXX
    for (let i = 0; i < numRows; i++) {
        let sep = (i === 0) ? topSep : nonTopSep;
        let msg = cols.map((col, j) => col[i].padStart(widths[j])).join(sep);
        say(msg.replaceAll(' ', '&nbsp;'));
    }
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

function sortWithPartialInfo2(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    console.log('Start sortWithPartialInfo2()');
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






    // End of the main stuff.
    // ______________________________________________________________________

    // DEBUG1
    console.log(`numCmpCalls = ${numCmpCalls}`);
    console.log('End sortWithPartialInfo()');

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
    let result = sortWithPartialInfo1(arr, cmp);
    check(result[0] === 0 && result[1] === 1);
}

// Test with a standard total ordering; larger array this time.
function test2() {
    let arr = [...Array(10).keys()];
    function cmp(x, y) {
        return (x < y) ? '<' : (x > y ? '>' : '=');
    }
    let result = sortWithPartialInfo1(arr, cmp);
    check(result.every((x, i) => (x === i)));
}


// This is a general test function meant to be called multiple times
// with different integer-valued arrays.
function testWithWeirdCmp(arr) {
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
    let result = sortWithPartialInfo1(arr, cmp);
    console.log('result:');
    console.log(result);
}

// The next two tests check performance on a partial comparison function with a
// single element (0) as a kind of bottleneck between two subcases that are
// otherwise non-comparable.

function test3() {
    let k = 1;
    let n = 2 * k + 1;
    let arr = Array.from({length: n}, (_, i) => i - k);
    testWithWeirdCmp(arr);
}

function test4() {
    let k = 4;
    let n = 2 * k + 1;
    let arr = Array.from({length: n}, (_, i) => i - k);
    testWithWeirdCmp(arr);
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
    let result = sortWithPartialInfo1(arr, cmp);
    console.log('result:');
    console.log(result);
}


// ______________________________________________________________________
// Run the tests

allTests = [test1, test2, test3, test4, test5];
allTests.forEach(testFn => {
    activeTest = testFn;
    console.log('\n' + '_'.repeat(80));
    console.log(`Running ${testFn.name}`);
    testFn();
});
console.log('Done running all tests!');
