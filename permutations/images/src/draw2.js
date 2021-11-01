/* draw2.js
 *
 * Functions to draw stuff.
 * This version is meant to support both svg and canvas elements.
 * The previous version was purely for svg.
 *
 */


// ______________________________________________________________________
// Internal globals

let eps = 0.00001;  // Used to check for mostly-equality.

// Set this temporarily to true to help debug drawing.
let doDebugPrint = false;

let lineStyle = {
    stroke: '#444',
    fill:   'transparent',
    'stroke-width': 0.3
};


// ______________________________________________________________________
// Debugging functions

function log(msg) {
    if (!doDebugPrint) return;
    console.log(msg);
}


// ______________________________________________________________________
// SVG helper functions

function addAttributes(elt, attr) {
    for (var key in attr) {
        elt.setAttribute(key, attr[key]);
    }
    return elt;
}

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

class SVGArtist {
    constructor(elt) {
        this.elt = elt;
        this.toCanvasScale = 1;
        this.origin = [0, 0];
        this.width  = parseInt(elt.getAttribute('width'));
        this.height = parseInt(elt.getAttribute('height'));
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

    // Set the frame for the logical coordinate system.
    // By default (without calling this function), the limits are those of the
    // system, which is from (0, 0) to (width, height) of the container element.
    // You may call this as (wMin, wMax), and the coordinates will be square.
    setCoordLimits(xMin, xMax, yMin, yMax) {
        console.assert(xMin !== undefined && xMax !== undefined);
        if (yMin === undefined) yMin = xMin;
        if (yMax === undefined) yMax = xMax;
        // XXX For now this assumes the user has provided a valid aspect ratio.
        //     I plan to _not_ support separate toCanvasScaleX and
        //     toCanvasScaleY values. In the future, if an aspect ratio is off,
        //     we'll default letterbox to make their frame fit, but their
        //     content will not fill the container element. We can provide a
        //     warning in this case.
        this.toCanvasScale = this.width / (xMax - xMin);
        if (Math.abs(this.toCanvasScale - this.height / (yMax - yMin)) > eps) {
            console.log('!!: Inconsistent aspect ratio in setCoordLimits().');
        }
        this.origin[0] = -this.toCanvasScale / xMin;
        this.origin[1] = -this.toCanvasScale / yMin;
    }

    mapToCanvasPt(pt) {
        return {
            x: pt.x * this.toCanvasScale + this.origin[0],
            y: pt.y * this.toCanvasScale + this.origin[1]
        };
    }

    addCircle(center, radius, style, parent) {
        // We might receive a style without a radius.
        if (typeof radius === 'object') {
            parent = style;
            style = radius;
            radius = undefined;
        } else if (style === undefined) {
            style = lineStyle;
        }

        let centerStr = `(${center.x}, ${center.y})`;
        log(`circle(center=${centerStr}, radius=${radius}, style=${style})`);

        var circle = this.add('circle', style, parent);
        var center = this.mapToCanvasPt(center);

        // XXX TODO Switch from {x, y} to [x, y].
        addAttributes(circle, {
            cx: center.x,
            cy: center.y
        });
        if (radius !== undefined) {
            addAttributes(circle, { r: radius * this.toCanvasScale });
        }
        return circle;
    }
}

class CanvasArtist {
}


// ______________________________________________________________________
// Public interface

export function inId(id, w, h) {
    let elt = document.getElementById(id);

    let classes = {'svg': SVGArtist, 'canvas': CanvasArtist};

    console.assert(elt.tagName.toLowerCase() in classes);

    if (w) {
        if (h === undefined) h = w;
        elt.setAttribute('width', w);
        elt.setAttribute('height', h);
    }

    // XXX
    return new SVGArtist(elt);
}
