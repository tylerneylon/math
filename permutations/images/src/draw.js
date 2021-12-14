/* draw.js
 *
 * Functions to draw stuff.
 * This version is meant to support both svg and canvas elements.
 * The previous version was purely for svg.
 *
 */


/* Planning
 *
 *  [ ] Switch everything over to xy arrays from xy objects.
 *
 */


// ______________________________________________________________________
// Imports

import * as dispatcher from './dispatcher.js';


// ______________________________________________________________________
// Internal globals

let eps = 0.00001;  // Used to check for mostly-equality.

// Set this temporarily to true to help debug drawing.
let doDebugPrint  = false;
let doTimingPring = false;

let logNum = 0;
let logBreakpoint = null;

let fillStyle = {
    stroke: 'transparent',
    fill:   '#222'
};

let lineStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 0.3
};


// ______________________________________________________________________
// Debugging functions

function log(msg) {
    if (!doDebugPrint) return;
    console.log(`${logNum}: ${msg}`);
    if (logNum === logBreakpoint) debugger;
    logNum++;
}

function st(obj) {
    if (typeof obj === 'number') return obj.toFixed(2);
    if (Array.isArray(obj)) {
        return `[${obj.map(st).join(', ')}]`;
    }
    if (typeof obj === 'object') {
        let items = [];
        for (const [key, value] of Object.entries(obj)) {
            let keyStr = /^[A-Za-z_]\w*$/.test(key) ? key : `"${key}"`;
            items.push(`"${keyStr}": "${st(value)}"`);
        }
        return `{${items.join(', ')}}`;
    }
    return obj;
}

function xyst(obj) {
    return `{x: ${st(obj.x)}, y: ${st(obj.y)}}`;
}


// ______________________________________________________________________
// Canvas helper functions

// This is from here:
// https://stackoverflow.com/a/7838871/3561
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y,     x + w, y + h, r);
    this.arcTo(x + w, y + h, x,     y + h, r);
    this.arcTo(x,     y + h, x,     y,     r);
    this.arcTo(x,     y,     x + w, y,     r);
    this.closePath();
    return this;
}


// ______________________________________________________________________
// Class definitions

class Artist {
    constructor(elt) {
        this.elt = elt;
        this.toCanvasScale = 1;
        this.origin = [0, 0];
        this.width  = parseInt(elt.getAttribute('width'));
        this.height = parseInt(elt.getAttribute('height'));

        // The pixel ratio is only really needed by canvas elements, since svg
        // containers automatically handle this. However, it's useful to have a
        // universally available number here.
        this.ctx = {ratio: 1};

        this.addMode = 'atEnd';  // Could be 'atStart'.
    }

    // Public interface

    // Set the frame for the logical coordinate system.
    // By default (without calling this function), the limits are those of the
    // system, which is from (0, 0) to (width, height) of the container element.
    // You may call this as (wMin, wMax), and the coordinates will be square.
    setCoordLimits(xMin, xMax, yMin, yMax) {
        console.assert(xMin !== undefined && xMax !== undefined);
        if (yMin === undefined) yMin = xMin;
        if (yMax === undefined) yMax = xMax;
        // TODO For now this assumes the user has provided a valid aspect ratio.
        //      I plan to _not_ support separate toCanvasScaleX and
        //      toCanvasScaleY values. In the future, if an aspect ratio is off,
        //      we'll default letterbox to make their frame fit, but their
        //      content will not fill the container element. We can provide a
        //      warning in this case.
        let xScale = this.width / (xMax - xMin);
        let yScale = this.height / (yMax - yMin);
        this.toCanvasScale = xScale;
        if (Math.abs(xScale - yScale) > eps) {
            console.log('!!: Inconsistent aspect ratio in setCoordLimits().');
        }
        this.origin[0] = -this.toCanvasScale * xMin;
        this.origin[1] = -this.toCanvasScale * yMin;
        log(`Setting toCanvasScale=${this.toCanvasScale}; ` +
            `origin=${this.origin}`);
    }

    setSize(w, h) {
        if (h === undefined) h = w;
        console.assert(typeof w === 'number');
        this.width = w;
        this.elt.style.width  = w  + 'px';
        this.height = h;
        this.elt.style.height = h + 'px';
        this.elt.setAttribute('width',  w);
        this.elt.setAttribute('height', h);

        this.elt.setAttribute('width',  this.ctx.ratio * w);
        this.elt.setAttribute('height', this.ctx.ratio * h);
    }

    mapToCanvasPt(pt) {
        return {
            x: pt.x * this.toCanvasScale + this.origin[0],
            y: pt.y * this.toCanvasScale + this.origin[1]
        };
    }

    drawInFront() {
        this.addMode = 'atEnd';
    }

    drawBehind() {
        this.addMode = 'atStart';
    }

    // If a radius is provided, then it's interpreted in unit coordinates;
    // however, if only a style-with-radius (`r`) is provided, then that value
    // is interpreted as a measure in pixels.
    addCircle(center, radius, style, parent) {
        // We might receive a style without a radius.
        if (typeof radius === 'object') {
            parent = style;
            style = radius;
            radius = undefined;
        } else if (style === undefined) {
            style = lineStyle;
        }

        log(`circle(center=${xyst(center)}, radius=${radius}, ` +
            `style=${st(style)})`);

        var circle = this.add('circle', style, parent);
        if (style.r) addAttributes(circle, {r: style.r});
        this.moveCircle(circle, center, radius);

        // -------------------------------------------------------------------

        var center = this.mapToCanvasPt(center);

        // TODO Switch from {x, y} to [x, y].
        addAttributes(circle, {
            cx: center.x,
            cy: center.y
        });
        if (radius !== undefined) {
            addAttributes(circle, { r: radius * this.toCanvasScale });
        } else if (style.r) {
            addAttributes(circle, {r: style.r});
        }

        // -------------------------------------------------------------------

        return circle;
    }

    moveCircle(circle, center, radius) {
        center = this.mapToCanvasPt(center);
        circle.setAttribute('cx', center.x);
        circle.setAttribute('cy', center.y);
        if (radius !== undefined) {
            circle.setAttribute('r', radius * this.toCanvasScale);
        }
    }

    addLine(from, to, style, parent) {
        if (style === undefined) style = lineStyle;
        log(`line(from=${xyst(from)}, to=${xyst(to)}, style=${st(style)})`);
        let line = this.add('line', style, parent);
        from = this.mapToCanvasPt(from);
        to = this.mapToCanvasPt(to);
        addAttributes(line, {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y
        });
        return line;
    }

    moveLine(line, from, to) {
        from = this.mapToCanvasPt(from);
        to   = this.mapToCanvasPt(to);
        addAttributes(line, {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y
        });
    }

    addRect(xy, style, parent) {
        if (style === undefined) style = fillStyle;
        log(`rect(xy=${xyst(xy)}, style=${st(style)})`);
        let rect = this.add('rect', style, parent);
        addAttributes(rect, this.mapToCanvasPt(xy));
        return rect;
    }

    addText(leftBaseline, str, style, parent) {
        if (style === undefined) style = fillStyle;
        log(`text(leftBaseline=${xyst(leftBaseline)}, str=${str}, ` +
            `style=${st(style)})`);
        let text = this.add('text', style, parent);
        text.ctx = this.ctx;  // This is needed for text.getBBox().

        leftBaseline = this.mapToCanvasPt(leftBaseline);
        text.innerHTML = str;
        addAttributes(text, leftBaseline);
        if (false) {
            // I'll leave this here for reference.
            addAttributes(text, {style: 'font-family: sans-serif'});
        }
        return text;
    }

    moveText(text, xy) {
        xy = this.mapToCanvasPt(xy);
        addAttributes(text, xy);
    }

    // This expects `pts` to be an array of {x, y} points. The polygon will be
    // closed for you; do not provide the initial point again.
    // (This can accept either {x, y} points or array points.)
    addPolygon(pts, style, parent) {
        if (style === undefined) style = fillStyle;
        log(`polygon(pts=${st(pts)}, style=${st(style)})`);
        let polygon = this.add('polygon', style, parent);
        this.movePolygon(polygon, pts);
        return polygon;
    }

    movePolygon(polygon, pts, ptArray) {
        let ptStrs  = [];
        ptArray = ptArray || [];
        for (let pt of pts) {
            let p = (typeof pt.x === 'undefined' ? {x: pt[0], y: pt[1]} : pt);
            let canvasPt = this.mapToCanvasPt(p);
            ptStrs.push(`${canvasPt.x},${canvasPt.y}`);
            ptArray.push([canvasPt.x, canvasPt.y]);
        }
        addAttributes(polygon, {points: ptStrs.join(' ')});
        addAttributes(polygon, {ptArray});
    }

    // For now, this only expects a description string in SVG format:
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    addPath(descStr, style, parent) {
        if (style === undefined) style = lineStyle;
        log(`path(descStr=${descStr}, style=${st(style)}`);
        style.d = descStr;
        return this.add('path', style, parent);
    }

    // The next two functions are no-ops for an SVG container, but do useful
    // things for a canvas.

    autorender() {}
    render() {}
}

class SVGArtist extends Artist {
    constructor(elt) {
        super(elt);
        this.svgNS  = elt.namespaceURI;
    }

    // Internal helper functions

    add(eltName, attr, parent) {
        if (parent === undefined) { parent = this.elt; }
        var elt = document.createElementNS(this.svgNS, eltName);
        this._addToParent(elt, parent);
        if (attr) addAttributes(elt, attr);
        return elt;
    }

    _addToParent(elt, parent) {
        if (this.addMode === 'atEnd') {
            parent.appendChild(elt);
            return;
        }
        if (this.addMode === 'atStart') {
            if (parent.firstElementChild === null) {
                parent.appendChild(elt);
            } else {
                parent.insertBefore(elt, parent.firstElementChild);
            }
            return;
        }

        console.assert(false);  // We shouldn't get here.
    }

    // Public interface

    clear() {
        this.elt.replaceChildren();
    }
}

class CanvasItem {
    constructor(itemType, artist) {
        this.type   = itemType;
        this.attrs  = {};
        this.artist = artist;
        this.listeners = {};

        // A note about this.dispatcher:
        // - An Item by default does not have any attached event listeners, so
        //   it does not need a dispatcher to send messages to.
        // - An item gets its own dispatcher (this.dispatcher) only when an
        //   event listener wants updates, such as mouse{out,over}. Only in that
        //   case do we pass on itemChanged() messages. It is expected that the
        //   dispatcher calls addDispatcher().
        // - Any item may receive addEventListener(), in which case we use the
        //   general dispatcher associated with the artist.
    }

    setAttribute(key, value) {
        this.attrs[key] = value;
        if (key === 'display' && this.dispatcher) {
            this.dispatcher.itemChanged(this);
        }
        this.artist.needsRender = true;
    }

    getAttribute(key) {
        return this.attrs[key];
    }

    addEventListener(eventName, handler) {
        this.artist.dispatcher.addItemListener(this, eventName, handler);
    }

    addDispatcher(dispatcher) {
        this.dispatcher = dispatcher;
    }

    remove() {
        if (this.parentElement === undefined) return;
        let i = this.parentElement.items.indexOf(this);
        this.parentElement.items.splice(i, 1);
        this.parentElement = undefined;
    }

    // This is useful for render().
    _getAttrs(ctx, keys) {
        for (let key of keys) console.assert(key in this.attrs);
        let values = [];
        for (let key of keys) values.push(this.attrs[key] * ctx.ratio);
        return values;
    }

    _getFontString(ctx) {
        const fontName = this.attrs['font-family'] || 'sans-serif';
        const sizeStr  = this.attrs['font-size'] || '16px';
        const fontSize = parseFloat(sizeStr) * ctx.ratio;
        const fontUnit = sizeStr.match(/[A-Za-z]+/)[0];
        return `${fontSize}${fontUnit} ${fontName}`;
    }

    isPointInside(ctx, x, y) {
        console.assert(this.path !== undefined);
        if (this.attrs.display === 'none') return false;
        return ctx.isPointInPath(this.path, x, y);
    }

    getBBox() {
        console.assert(this.type === 'text');
        this.ctx.font = this._getFontString(this.ctx);
        let metrics = this.ctx.measureText(this.innerHTML);
        let width  = metrics.width;
        let height = metrics.fontBoundingBoxAscent +
                     metrics.fontBoundingBoxDescent;
        let r = this.ctx.ratio;
        width  /= r;
        height /= r;
        return {width, height};
    }

    render(ctx, dx, dy) {

        if (dx === undefined) {
            dx = 0;
            dy = 0;
        } else if (ctx.ratio) {
            dx *= ctx.ratio;
            dy *= ctx.ratio;
        }

        if ('stroke-width' in this.attrs) {
            let width = this.attrs['stroke-width'];
            if (ctx.ratio) width *= ctx.ratio;
            ctx.lineWidth = width;
        }

        // Stroke color.
        if ('stroke' in this.attrs) {
            ctx.strokeStyle = this.attrs.stroke;
        }

        if (this.attrs.visibility === 'hidden') return;

        if (this.type === 'circle') {
            let [cx, cy, r] = this._getAttrs(ctx, ['cx', 'cy', 'r']);
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
            if ([undefined, 'transparent'].includes(this.attrs.stroke)) {
                ctx.fillStyle = this.attrs.fill;
                ctx.fill();
            } else {
                // Workaround for a rendering issue.
                if (r < ctx.lineWidth / 2) {
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.beginPath();
                    let r2 = r + ctx.lineWidth / 2;
                    ctx.ellipse(cx, cy, r2, r2, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            }
        }

        if (this.type === 'line') {
            let [x1, y1, x2, y2] = this._getAttrs(
                ctx,
                ['x1', 'y1', 'x2', 'y2']
            );
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = this.attrs['stroke-width'] * ctx.ratio;
            ctx.stroke();
        }

        if (this.type === 'polygon') {
            if (this.attrs.display === 'none') return;
            if ([undefined, 'transparent'].includes(this.attrs.stroke)) {
                ctx.fillStyle = this.attrs.fill;
                ctx.fill(this.path);
            } else {
                ctx.stroke(this.path);
            }
            // TODO Factor out the stroke/fill part of rendering.
        }

        if (this.type === 'rect') {
            let [x, y, width, height] = this._getAttrs(
                ctx,
                ['x', 'y', 'width', 'height']
            );
            x += dx;
            y += dy;
            // For now we only support non-rounded corners or a single radius.
            let rx = this.attrs.rx;
            ctx.fillStyle = this.attrs.fill;
            if (rx === 0 || rx === undefined) {
                ctx.fillRect(x, y, width, height);
            } else {
                rx *= ctx.ratio;
                ctx.roundRect(x, y, width, height, rx).fill();
            }
        }

        if (this.type === 'text') {
            let [x, y] = this._getAttrs(ctx, ['x', 'y']);
            ctx.font = this._getFontString(ctx);
            x += dx;
            y += dy;
            let stroke = this.attrs.stroke;
            let drawText = null;
            if (stroke && stroke !== 'transparent') {
                drawText = ctx.strokeText.bind(ctx);
            } else {
                drawText = ctx.fillText.bind(ctx);
            }
            ctx.fillStyle = this.attrs.fill || '#000';
            drawText(this.innerHTML, x, y);
        }

        if (this.type === 'path') {
            if (!this.path) {
                console.assert('d' in this.attrs);
                const d = this.attrs.d;
                this.path = new Path2D(d);
            }
            const oldLineWidth = ctx.lineWidth;
            ctx.scale(ctx.ratio, ctx.ratio);
            ctx.lineWidth /= ctx.ratio;
            ctx.stroke(this.path);
            ctx.resetTransform();
            ctx.lineWidth = oldLineWidth;
        }

    }
}

class CanvasGroup extends CanvasItem {
    constructor(itemType) {
        super(itemType);
        this.items = [];
    }

    append(...children) {
        for (const kiddo of children) this.appendChild(kiddo);
    }

    appendChild(child) {
        this.items.push(child);
        child.parentElement = this;
    }

    render(ctx) {
        let [dx, dy] = [0, 0];
        if (this.attrs.transform) {
            let t = this.attrs.transform;
            [dx, dy] = t.match(/[0-9\.-]+/g).map(x => parseFloat(x));
        }
        for (let item of this.items) item.render(ctx, dx, dy);
    }
}

class CanvasArtist extends Artist {
    constructor(elt) {
        super(elt)
        // `items` is the array of CanvasItem instances to be rendered, in the
        // order we will render them (so the last one appears on top).
        this.items = [];
        this.addMode = 'atEnd';
        this.ctx = elt.getContext('2d');

        // Adjust for a possible retina display.
        let ratio = window.devicePixelRatio || 1;
        log(`Setting ratio to ${ratio}`);
        this.ctx.ratio = ratio;

        if (this.ctx.ratio !== 1) {
            elt.style.width  = elt.width  + 'px';
            elt.style.height = elt.height + 'px';
            elt.width  *= ratio;
            elt.height *= ratio;
        }
        this.doAutorender  = false;
        this.needsRender = false;
        this._dispatcher = null;
    }

    // Internal helper functions

    get dispatcher() {
        if (this._dispatcher === null) {
            this._dispatcher = new dispatcher.Dispatcher(this.elt);
        }
        return this._dispatcher;
    }

    add(eltName, attr, parent) {
        if (parent === undefined) { parent = this; }
        let Item = (eltName === 'g' ? CanvasGroup : CanvasItem);
        var item = new Item(eltName);
        item.artist = this;
        this._addToParent(item, parent);
        if (attr) addAttributes(item, attr);
        if (item.attrs.display !== 'none') this.needsRender = true;
        return item;
    }

    _addToParent(item, parent) {
        item.parentElement = parent;
        if (this.addMode === 'atEnd') {
            parent.items.push(item);
            return;
        }
        if (this.addMode === 'atStart') {
            parent.items.unshift(item);
            return;
        }

        console.assert(false);  // We shouldn't get here.
    }

    // Public interface

    moveCircle(circle, center, radius) {
        super.moveCircle(circle, center, radius);
        let path  = new Path2D();
        let ratio = this.ctx.ratio;
        let r = circle.getAttribute('r') * ratio
        center = this.mapToCanvasPt(center);
        path.arc(center.x * ratio, center.y * ratio, r, 0, 2 * Math.PI);
        circle.path = path;
        // XXX I think right now my dispatcher system is inefficient, because
        // isPointInside() can only possibly change values when 'display'
        // changes or when the path changes. So it _should_ be triggered here
        // (only for canvas items), but not anywhere else (except the 'display'
        // change).
        if (this.dispatcher) this.dispatcher.itemChanged(circle);
        if (circle.attrs.display !== 'none') this.needsRender = true;
    }

    moveLine(line, from, to) {
        super.moveLine(line, from, to);
        if (line.attrs.display !== 'none') this.needsRender = true;
    }

    movePolygon(polygon, pts) {
        const ptArray = [];
        super.movePolygon(polygon, pts, ptArray);

        // Set up our path.
        let path = new Path2D();
        if (pts.length > 0) {
            let ratio = this.ctx.ratio;
            let p = ptArray.map(x => [x[0] * ratio, x[1] * ratio]);
            path.moveTo(p[0][0], p[0][1]);
            for (let i = 1; i < p.length; i++) path.lineTo(p[i][0], p[i][1]);
            path.closePath();
        }
        polygon.path = path;
        if (this.dispatcher) this.dispatcher.itemChanged(polygon);

        if (polygon.attrs.display !== 'none') this.needsRender = true;
    }

    autorender() {
        this.doAutorender = true;
        window.requestAnimationFrame(this.render.bind(this));
    }

    render() {
        if (this.doAutorender) {
            window.requestAnimationFrame(this.render.bind(this));
        }

        if (!this.needsRender) return;
        let start = Date.now();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.elt.width, this.elt.height);
        for (let item of this.items) item.render(this.ctx, this);
        this.needsRender = false;
        let duration = Date.now() - start;
        if (doTimingPring) console.log(`render() call took ${duration}ms.`);
    }

    clear() {
        this.items = [];
        this.needsRender = false;
        this._dispatcher = null;
    }

    appendChild(child) {
        this.items.push(child);
        child.parentElement = this;
        this.needsRender = true;
    }
}


// ______________________________________________________________________
// Public interface

export function inId(id, w, h) {
    let elt = document.getElementById(id);
    console.assert(elt, `Sadly, I don't see an element with id "${id}"`);

    let classes = {'svg': SVGArtist, 'canvas': CanvasArtist};

    let tagName = elt.tagName.toLowerCase();
    console.assert(tagName in classes);

    if (w) {
        if (h === undefined) h = w;
        elt.setAttribute('width', w);
        elt.setAttribute('height', h);
    }

    return new classes[tagName](elt);
}

// TODO Could I effectively add this to all drawable items as a method?
export function addAttributes(elt, attr) {
    for (var key in attr) {
        elt.setAttribute(key, attr[key]);
    }
    return elt;
}

// Point movement functions

// This returns the result (the inputs are left unchanged).
export function translate(pt, by) {
    return {
        x: pt.x + by.x,
        y: pt.y + by.y
    }
}
