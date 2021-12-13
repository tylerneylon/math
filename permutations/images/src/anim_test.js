/* anim_test.js
 *
 * Understand how to create a smooth ongoing animation in svg.
 *
 * Use:
 * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
 *
 */


// ______________________________________________________________________
// Imports

import * as draw from './draw.js';
import * as init from './init.js';


// ______________________________________________________________________
// Globals

let angle  = 0;
let circle = null;
let R      = 0.8;
let lastTs = null;
let artist = null;

let circleStyle = {
    stroke: 'transparent',
    fill:   '#888'
};


// ______________________________________________________________________
// Functions

function drawFrame(ts) {

    let rotationsPerSec = 0.5;

    if (circle === null) {
        let r = 0.1;
        circle = artist.addCircle({x: R, y: 0}, r, circleStyle);
    } else {
        angle += rotationsPerSec * 2 * Math.PI * (ts - lastTs) / 1000;
        let center = {x: R * Math.cos(angle), y: R * Math.sin(angle)};
        artist.moveCircle(circle, center);
    }

    lastTs = ts;
    window.requestAnimationFrame(drawFrame);
}

function animateCircle() {
    window.requestAnimationFrame(drawFrame);
}


// ______________________________________________________________________
// Main

window.addEventListener('DOMContentLoaded', (event) => {

    artist = init.setup2();

    animateCircle();
});
