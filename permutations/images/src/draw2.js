/* draw2.js
 *
 * Functions to draw stuff.
 * This version is meant to support both svg and canvas elements.
 * The previous version was purely for svg.
 *
 */


/* XXX TEMP planning
 *
 *  [x] Be able to addLine()
 *  [ ] Be able to addAttributes()
 *  [ ] Support fill without stroke
 *  [ ] Support stroke without fill
 *  [ ] Support fill and stroke
 *  [ ] Switch everything over to xy arrays from xy objects.
 *
 */

// ______________________________________________________________________
// Internal globals

let eps = 0.00001;  // Used to check for mostly-equality.

// Set this temporarily to true to help debug drawing.
let doDebugPrint = true;
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
// SVG helper functions

function addAtEnd(elt, parent) {
    parent.appendChild(elt);
}

function addAtStart(elt, parent) {
    if (parent.firstElementChild === null) {
        parent.appendChild(elt);
    } else {
        parent.insertBefore(elt, parent.firstElementChild);
    }
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
        // The context is mainly used for canvas elements, but it's useful here
        // to have a single place for the pixel ratio.
        this.ctx = {ratio: 1};
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
        let xScale = this.width / (xMax - xMin) * this.ctx.ratio;
        let yScale = this.height / (yMax - yMin) * this.ctx.ratio;
        this.toCanvasScale = xScale;
        if (Math.abs(xScale - yScale) > eps) {
            console.log('!!: Inconsistent aspect ratio in setCoordLimits().');
        }
        this.origin[0] = -this.toCanvasScale / xMin;
        this.origin[1] = -this.toCanvasScale / yMin;
    }

    setSize(w, h) {
        if (h === undefined) h = w;
        console.assert(typeof w === 'number');
        this.elt.setAttribute('width', w);
        this.width = w;
        this.elt.setAttribute('height', h);
        this.height = h;
    }

    mapToCanvasPt(pt) {
        return {
            x: pt.x * this.toCanvasScale + this.origin[0],
            y: pt.y * this.toCanvasScale + this.origin[1]
        };
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
        var center = this.mapToCanvasPt(center);

        // XXX TODO Switch from {x, y} to [x, y].
        addAttributes(circle, {
            cx: center.x,
            cy: center.y
        });
        if (radius !== undefined) {
            addAttributes(circle, { r: radius * this.toCanvasScale });
        } else if (style.r) {
            addAttributes(circle, {r: style.r});
        }

        return circle;
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

    addText(leftBaseline, str, style, parent) {
        if (style === undefined) style = fillStyle;
        log(`text(leftBaseline=${xyst(leftBaseline)}, str=${str}, ` +
            `style=${st(style)})`);
        let text = this.add('text', style, parent);

        leftBaseline = this.mapToCanvasPt(leftBaseline);
        text.innerHTML = str;
        addAttributes(text, leftBaseline);
        if (false) {
            // I'll leave this here for reference.
            addAttributes(text, {style: 'font-family: sans-serif'});
        }
        return text;
    }
}

class SVGArtist extends Artist {
    constructor(elt) {
        super(elt);
        this.svgNS  = elt.namespaceURI;
        this.addToParent = addAtEnd;
    }

    // Internal helper functions

    add(eltName, attr, parent) {
        if (parent === undefined) { parent = this.elt; }
        var elt = document.createElementNS(this.svgNS, eltName);
        this.addToParent(elt, parent);
        if (attr) addAttributes(elt, attr);
        return elt;
    }

    // Public interface

}

class CanvasItem {
    constructor(itemType) {
        this.type = itemType;
        this.attrs = {};
        this.items = [];  // This is used by the 'g' type.
    }

    setAttribute(key, value) {
        this.attrs[key] = value;
        console.log(`[${this.type}]: setting ${key} -> ${value}`);
    }

    addEventListener(eventName, handler) {
        log(`Ignoring event listener for ${eventName} on canvas ${this.type}.`);
    }

    render(ctx) {

        if ('stroke-width' in this.attrs) {
            let width = this.attrs['stroke-width'];
            if (ctx.ratio) width *= ctx.ratio;
            ctx.lineWidth = width;
        }

        // Stroke color.
        if ('stroke' in this.attrs) {
            ctx.strokeStyle = this.attrs.stroke;
        }

        if (this.type === 'circle') {
            for (let key of ['cx', 'cy', 'r']) {
                console.assert(key in this.attrs);
            }
            let [cx, cy, r] = [this.attrs.cx, this.attrs.cy, this.attrs.r];
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.type === 'line') {
            for (let key of ['x1', 'y1', 'x2', 'y2']) {
                console.assert(key in this.attrs);
            }
            let [x1, y1, x2, y2] = [
                this.attrs.x1,
                this.attrs.y1,
                this.attrs.x2,
                this.attrs.y2
            ]
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        if (this.type === 'g') {
            for (let item of this.items) item.render(ctx);
        }
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
        this.ctx.ratio = ratio;

        if (ratio !== 1) {
            elt.style.width  = elt.width  + 'px';
            elt.style.height = elt.height + 'px';
            elt.width  *= ratio;
            elt.height *= ratio;
        }
    }

    // Internal helper functions

    add(eltName, attr, parent) {
        if (parent === undefined) { parent = this; }
        var item = new CanvasItem(eltName);
        // TODO Eventually support other add modes. (this.addMode)
        parent.items.push(item);
        if (attr) addAttributes(item, attr);
        return item;
    }

    // Public interface

    render() {
        for (let item of this.items) item.render(this.ctx, this);
    }
}


// ______________________________________________________________________
// Public interface

export function inId(id, w, h) {
    let elt = document.getElementById(id);

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
