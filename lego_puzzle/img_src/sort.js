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
function sortWithPartialInfo(inputArr, inputCmp, ctx) {

    // XXX Delete all DEBUG1 code blocks.
    //     DEBUG1 = I'm attempting to reduce the number of cmp() calls when the
    //     input is already sorted or close to sorted.

    // DEBUG1
    console.log('Start sortWithPartialInfo()');
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

    let hl1 = '<span class="highlight">';
    let hl2 = '</span>';
    say('<p><hr>Beginning to sort<br>');
    say(`Candidate ${hl1}min = ${getShapeName(inputArr[min])}${hl2}`);

    let getName = x => getShapeName(inputArr[x]);
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
                let n = getShapeName(inputArr[min]);
                say(`<span class="framed">Adding shape ${n}</span>`);
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
                    let n = getShapeName(inputArr[min]);  // XXX
                    say(`Candidate ${hl1}min = ${n}${hl2}`);
                    printCmpTree(min, cmpTree);
                }
                break;
            }

            let x = arr[xIdx];
            let n = getShapeName(inputArr[x]);  // XXX
            if (x in cmpTree) {
                let minName = getShapeName(inputArr[min]);
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
                say(`New candidate ${hl1}min = ${n}${hl2}`);
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


// ______________________________________________________________________
// Tests
