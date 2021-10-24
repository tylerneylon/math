/* draw.js
 *
 * Functions to draw stuff.
 *
 */


// ______________________________________________________________________
// Internal globals.

export var ctx = {};
ctx.addToParent = addAtStart;
ctx.toCanvasScale = 1.0;
ctx.origin = {x: 0, y: 0}
ctx.doDebugPrint = false;
var ctxStack = [ctx];

var defs = null;
var nextLinGrad = 0;


// ______________________________________________________________________
// Utility functions.

// This expects an array of numbers. It converts them to a space-separated
// string join using the nearest-tenth rounded values. For example, the
// number 3.14159 would be represented as 3.1 in the string.
export function joinPts(pts) {
  var s = [];
  for (var i = 0; i < pts.length; i++) s.push(pts[i].toFixed(1));
  return s.join(' ')
}

// Map an {x, y} point from unit to canvas coordinates.
export function mapToCanvasPt(pt) {
    return {
        x: pt.x * ctx.toCanvasScale + ctx.origin.x,
        y: pt.y * ctx.toCanvasScale + ctx.origin.y
    };
}


// ______________________________________________________________________
// Debug functions.

function log(msg) {
    if (!ctx.doDebugPrint) return;
    console.log(msg);
}

// ______________________________________________________________________
// Functions that work with 2d points.

// This returns the result (the inputs are left unchanged).
export function translate(pt, by) {
    return {
        x: pt.x + by.x,
        y: pt.y + by.y
    }
}

// This returns the result (the inputs are left unchanged).
// The angle is in radians.
export function rotateBy(pt, angle) {
    // Mathematically, we can think of this as matrix multiplication by:
    //
    // U = ( cos -sin )
    //     ( sin  cos )
    var c = Math.cos(angle), s = Math.sin(angle)
    return {
        x: c * pt.x - s * pt.y,
        y: s * pt.x + c * pt.y
    }
}


// ______________________________________________________________________
// Functions that work with colors.

// This returns color1 * percentOf1 + color2 * (1.0 - percentOf2).
// This works with rgb color triples (arrays with 3 [0, 1] values).
export function blendColors(color1, color2, percentOf1) {
    var outColor = [];
    var p = percentOf1, q = 1.0 - percentOf1;
    for (var i = 0; i < 3; i++) {
        outColor[i] = color1[i] * p + color2[i] * q;
    }
    return outColor;
}

// This expects a colorStr like '#458'; if lightFactor is 1.0, the result is
// white. If lightFactor is 0.0, the output is the same as the input.
export function lightenBy(colorStr, lightFactor) {
    var color = [];
    for (var i = 1; i <= 3; i++) {
        color.push(parseInt(colorStr[i], 16) / 15);
    }
    var white = [1.0, 1.0, 1.0];
    color = blendColors(white, color, lightFactor);
    var outStr = '#';
    for (var i = 0; i < 3; i++) {
        outStr += Math.round(color[i] * 15).toString(16);
    }
    return outStr;
}


// ______________________________________________________________________
// Functions that manipulate the drawing context.

export function drawInFront() {
    ctx.addToParent = addAtEnd;
}

export function drawBehind() {
    ctx.addToParent = addAtStart;
}

export function pushContext() {
    var newCtx = {};
    for (var key in ctx) {
        newCtx[key] = ctx[key];
    }
    ctxStack.push(newCtx);
    ctx = newCtx;
}

export function popContext() {
    ctxStack.pop();
    ctx = ctxStack[ctxStack.length - 1];
}

// Values provided for rendering, such as points and distances, are scaled up by
// this amount before being rendered.
export function setScale(scale) {
    ctx.toCanvasScale = scale;
}

export function setOrigin(origin) {
    ctx.origin = origin;
}

export function setSVG(svg) {
    ctx.svg = svg;
    ctx.svgNS = svg.namespaceURI;
}


// ______________________________________________________________________
// Functions that add or modify general elements.

export function add(eltName, attr, parent) {
    if (parent === undefined) { parent = ctx.svg; }
    var elt = document.createElementNS(ctx.svgNS, eltName);
    ctx.addToParent(elt, parent);
    if (attr) addAttributes(elt, attr);
    return elt;
}

export function addAttributes(elt, attr) {
    for (var key in attr) {
        elt.setAttribute(key, attr[key]);
    }
    return elt;
}

export function addAtEnd(elt, parent) {
    parent.appendChild(elt);
}

export function addAtStart(elt, parent) {
    if (parent.firstElementChild === null) {
        parent.appendChild(elt);
    } else {
        parent.insertBefore(elt, parent.firstElementChild);
    }
}

export function addLinearGradient(fromColor, toColor, fromPt, toPt) {

    fromPt = mapToCanvasPt(fromPt);
    toPt   = mapToCanvasPt(toPt);

    var id = 'lingrad_' + nextLinGrad;
    nextLinGrad++;

    // Set up the linear gradient.
    if (defs === null) { defs = add('defs'); }
    var gradAttrs = {
        id,
        x1: fromPt.x,
        y1: fromPt.y,
        x2: toPt.x,
        y2: toPt.y,
        gradientUnits: 'userSpaceOnUse'
    };

    /* TODO Re-enable global debug flags.
    if (isDebugMode) {
        fromColor = 'red';
        toColor   = 'yellow';
    }
    */

    pushContext();
    drawInFront();
    const linGrad = add('linearGradient', gradAttrs, defs);
    add('stop', {offset: '0%',   'stop-color': fromColor}, linGrad);
    add('stop', {offset: '100%', 'stop-color':   toColor}, linGrad);
    popContext();

    return {stroke: `url("#${id}")`};
}


// ______________________________________________________________________
// Functions that draw specific shapes.

export function circle(center, radius, style, parent) {

    // We might receive a style without a radius.
    if (typeof radius === 'object') {
        parent = style;
        style = radius;
        radius = undefined;
    } else if (style === undefined) {
        style = defaultStyle;
    }

    let centerStr = `(${center.x}, ${center.y})`;
    log(`circle(center=${centerStr}, radius=${radius}, style=${style})`);

    var circle = add('circle', style, parent);
    var center = mapToCanvasPt(center);

    addAttributes(circle, {
        cx: center.x,
        cy: center.y
    });
    if (radius !== undefined) {
        addAttributes(circle, { r: radius * ctx.toCanvasScale });
    }
    return circle;
}

export function moveCircle(circle, center, radius) {
    center = mapToCanvasPt(center);
    circle.setAttribute('cx', center.x);
    circle.setAttribute('cy', center.y);
    if (radius !== undefined) {
        circle.setAttribute('r', radius * ctx.toCanvasScale);
    }
}

export function line(from, to, style, parent) {

    if (style === undefined) { style = lightStyle }

    var line = add('line', style, parent);
    from = mapToCanvasPt(from);
    to   = mapToCanvasPt(to);
    addAttributes(line, {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y
    });
    return line;
}

export function moveLine(line, from, to) {
    from = mapToCanvasPt(from);
    to   = mapToCanvasPt(to);
    addAttributes(line, {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y
    });
}

// This expects `pts` to be an array of {x, y} points.
// The polygon will be closed for you; do not provide the initial point again.
export function polygon(pts, style, parent) {

    if (style === undefined) { style = lightStyle }

    log(`polygon(pts=${pts}, style=${style})`);

    let ptStrs = [];
    for (let pt of pts) {
        let canvasPt = mapToCanvasPt(pt);
        ptStrs.push(`${canvasPt.x},${canvasPt.y}`);
    }
    let polygonElt = add('polygon', style, parent);
    addAttributes(polygonElt, {points: ptStrs.join(' ')});
    return polygonElt;
}

export function movePolygon(polygonElt, pts) {

    let ptStrs = [];
    for (let pt of pts) {
        let canvasPt = mapToCanvasPt(pt);
        ptStrs.push(`${canvasPt.x},${canvasPt.y}`);
    }
    addAttributes(polygonElt, {points: ptStrs.join(' ')});
}

export function rect(xy, style, parent) {

    if (style === undefined) { style = lightStyle }

    log(`rect(xy=${xy}, style=${style})`);

    let rectElt = add('rect', style, parent);
    addAttributes(rectElt, mapToCanvasPt(xy));
    return rectElt;
}

export function text(leftBaseline, str, style, parent) {

    if (style === undefined) { style = lightStyle }

    log(`text(leftBaseline=${leftBaseline}, str=${str}, style=${style})`);

    leftBaseline = mapToCanvasPt(leftBaseline);
    var t = add('text', style, parent);
    t.innerHTML = str;
    addAttributes(t, {x: leftBaseline.x, y: leftBaseline.y});
    if (false) {
        // I'll leave this here for reference.
        addAttributes(t, {style: 'font-family: sans-serif'});
    }
    return t;
}

export function moveText(textElt, xy) {
    xy = mapToCanvasPt(xy);
    addAttributes(textElt, xy);
}
