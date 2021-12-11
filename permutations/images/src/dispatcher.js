/* dispatcher.js
 *
 * XXX Once I have things working well, update these comments.
 *
 * The Dispatcher class is designed to provide mouseout and mouseover
 * events to objects which don't actually live in the DOM.
 * For now, the only use case I know if is to pretend like certain drawing
 * items in a canvas are mouse-event-receiving DOM elements.
 *
 * It expects to be used with a true DOM element; that main DOM element will
 * receive true mousemove and mouseout events that will be translated to virtual
 * mouse events for the items attached to a Dispatcher instance.
 *
 * Here is the interface and behavior expected of listening items:
 * - isPointInside(context, x, y);  // Returns true or false.
 * - addDispatcher(dispatcher);  // Registers a dispatcher.
 *
 * Once a dispatcher is added to that item, it's expected that the item will
 * call dispatcher.itemChanged(item) in order to register changes, such as
 * the item being hidden or taking on a different shape.
 *
 * The dispatcher provides these guarantees:
 * - At most one item at a time will have a `mouseover` state.
 * - When the current mouseover item changes, the `mouseout` event will be sent
 *   to the old mouseover item before the new one gets a `mouseover` event.
 * - Handler calls do not need to be re-entrant; that is, events are dispatched
 *   via setTimeout() so that they won't be called while other user code is on
 *   the stack.
 *
 */


// ______________________________________________________________________
// Imports

import * as util from './util.js';


// ______________________________________________________________________
// Internal globals

let doDebugPrint = false;
let logNum = 0;


// ______________________________________________________________________
// Debugging functions

function log(msg) {
    if (!doDebugPrint) return;
    console.log(`${logNum}: ${msg}`);
    logNum++;
}


// ______________________________________________________________________
// Class definitions

export class Dispatcher {
    constructor(elt) {

        // For now, this code assumes the passed in element is a canvas.
        // In the future I can imagine supporting other element types.

        this.items = [];
        // For item i (at this.items[i]), the listeners for eventName are
        // this.listeners[i][eventName] = [handler1, handler2, ...].
        this.listeners = [];
        this.ctx = elt.getContext('2d');
        this.mouseOverIndex = null;

        elt.addEventListener('mousemove', this._mousemove.bind(this));
        elt.addEventListener('mouseout', this._mouseout.bind(this));

        this.x = null;
        this.y = null;
    }

    _update() {
        const [x, y] = [this.x, this.y];
        if (x === null) return;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const r    = this.ctx.ratio;
            const isIn = item.isPointInside(this.ctx, r * x, r * y);

            if (isIn) {
                if (this.mouseOverIndex !== i) {
                    if (this.mouseOverIndex !== null) {
                        this._send(this.mouseOverIndex, 'mouseout');
                    }
                    this.mouseOverIndex = i;
                    this._send(i, 'mouseover');
                }
                break;
            } else if (this.mouseOverIndex === i) {
                this._send(this.mouseOverIndex, 'mouseout');
                this.mouseOverIndex = null;
            }
        }
    }

    _mousemove(event) {
        [this.x, this.y] = [event.offsetX, event.offsetY];
        this._update();
    }

    _mouseout(event) {
        if (this.mouseOverIndex === null) return;
        this._send(this.mouseOverIndex, 'mouseout');
        this.mouseOverIndex = null;
    }

    _send(idx, eventName) {
        const listeners = this.listeners[idx][eventName];
        const numL = listeners.length;
        log(`Sending ${eventName} to index ${idx} with ${numL} listeners.`);
        if (!listeners) return;
        const event = new Event(eventName);
        for (const handler of listeners) {
            setTimeout(handler, 0, event);
        }
    }

    addItemListener(item, eventName, handler) {
        if (!this.items.includes(item)) {
            this.items.push(item);
            item.addDispatcher(this);
        }
        const i = this.items.indexOf(item);
        if (this.listeners[i] === undefined) this.listeners[i] = {};
        util.push(this.listeners[i], eventName, handler);
    }

    itemChanged(item) {
        this._update();
    }
}
