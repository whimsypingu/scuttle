import { logDebug } from "../../utils/debug.js";


/**
 * -------------------------------------------------
 * Dragging Interaction Module
 * -------------------------------------------------
 * Enables **long-press + drag reordering** for `.list-track-item` elements
 * inside scrollable lists. It handles:
 *   - Reordering elements in a list
 *   - Hovering the selected element and following the cursor
 *   - Leaving a shadow to show where the element will fall
 *
 * Uses event delegation and dynamically attaches event listeners only when needed
 * to optimize performance on mobile/touch interfaces.
 *
 * Features:
 *   - Long-press activates drag mode
 *   - Placeholder element preserves layout while dragging
 *   - Auto-scrolls container when dragging near top/bottom edges
 *   - Cancels active swipe gestures by dispatching a `cancelSwipe` event
 *   - Prevents accidental drags during normal scrolling
 *
 * Event Lifecycle:
 * ----------------
 *  touchstart  →  onDragTouchStart
 *      ↓ sets longpress timer
 *  touchmove   →  onCancelDragTouchMove (cancel if user scrolls)
 *      ↓ if longpress duration met → beginDrag()
 *  touchmove   →  onDragTouchMove (drag ghost, reorder placeholder)
 *  touchend    →  onDragTouchEnd (cleanup, finalize order)
 */



/** -------------------------------------------------
 * State Variables
 * -------------------------------------------------
 * Used internally to track dragging state.
 */
const LONG_PRESS_DURATION = 1000; //ms
const MOVE_THRESHOLD = 8; 
const AUTOSCROLL_MARGIN = 40;
const AUTOSCROLL_SPEED = 12; //px/frame

let placeholder = null; //keeps layout intact

let longpressTimer = null;
let startX = 0, startY = 0;
let lastPointerX = 0, lastPointerY = 0;

let dragging = false;
let draggedEl = null;

let autoScrollActive = false;
let rafId = null; //magic



/** -------------------------------------------------
 * Helpers
 * -------------------------------------------------
 */

/**
 * Extracts client coordinates from a MouseEvent or TouchEvent.
 * @param {TouchEvent|MouseEvent} e - The input event.
 * @returns {{x: number, y: number}} Coordinates of pointer.
 */
function getPoint(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

/**
 * Finds the closest `.list-track-item` at the given screen coordinates,
 * excluding the dragged element and placeholder.
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {HTMLElement|null} The target item under pointer.
 */
function itemFromPoint(x, y) {
    let elem = document.elementFromPoint(x, y);
    if (!elem) return null;

    const item = elem.closest('.list-track-item');
    // optionally ignore ghost and placeholder
    if (item && item !== draggedEl && item !== placeholder) return item;
    return null;
}

/**
 * Updates ghost element’s visual position to follow pointer.
 * 
 * Notes:
 *   - Follows the lastPointerX and lastPointerY variables, which should be set prior.
 */
function moveGhost() {
    if (!draggedEl) return;
    draggedEl.style.left = `${lastPointerX}px`;
    draggedEl.style.top = `${lastPointerY}px`;
}

/**
 * Restores dragged element’s visual state after dropping.
 */
function undoGhost() {
    draggedEl.classList.remove('dragging');

    //manually revert, without this the styles may not correctly revert
    //frontend/css/list-track-item.css (see .dragging styles)
    Object.assign(draggedEl.style, {
        position: "",
        top: "",
        left: "",
        width: "",
        zIndex: "",
        pointerEvents: "",
        boxShadow: "",
        borderRadius: "",
        transform: "",
    }); //refactored
}

/**
 * Moves the placeholder element up or down depending on the pointer’s Y position.
 * Keeps layout intact during reordering.
 */
function updatePlaceholder() {
    const target = itemFromPoint(lastPointerX, lastPointerY);
    if (target && target !== placeholder && target !== draggedEl) {
        const rect = target.getBoundingClientRect();
        const before = (lastPointerY < rect.top + rect.height / 2);
        
        //where to insert
        if (before) {
            target.parentNode.insertBefore(placeholder, target);
        } else {
            target.parentNode.insertBefore(placeholder, target.nextSibling);
        }
    }
}




/** -------------------------------------------------
 * Auto-scrolling
 * -------------------------------------------------
 */

/**
 * Continuously scrolls the list while dragging near its vertical edges.
 * Called recursively via requestAnimationFrame.
 */
function autoScrollStep() {
    if (!dragging) { autoScrollActive = false; return; }
    const list = placeholder.parentNode;
    const rect = list.getBoundingClientRect();
    const y = lastPointerY;

    if (y < rect.top + AUTOSCROLL_MARGIN) list.scrollTop -= AUTOSCROLL_SPEED;
    else if (y > rect.bottom - AUTOSCROLL_MARGIN) list.scrollTop += AUTOSCROLL_SPEED;

    //ui changes on autoscrolling, when the element isnt necessarily moving
    moveGhost();
    updatePlaceholder();

    rafId = requestAnimationFrame(autoScrollStep); //magic!
}

/**
 * Starts automatic scrolling when dragging near edges.
 */
function startAutoScroll() {
    if (!autoScrollActive) {
        autoScrollActive = true;
        rafId = requestAnimationFrame(autoScrollStep);
    }
}

/**
 * Stops auto-scroll if active.
 */
function stopAutoScroll() {
    autoScrollActive = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}



/** -------------------------------------------------
 * Drag Lifecycle
 * -------------------------------------------------
 */

/**
 * Begins a drag operation after longpress is detected.
 * Creates a placeholder, enables autoscroll, and updates state.
 * @param {TouchEvent|MouseEvent} e - Original event that triggered drag.
 * @param {HTMLElement} el - The element being dragged.
 */
function beginDrag(e, el) {
    dragging = true;
    draggedEl = el;
    draggedEl.classList.add("dragging");

    //placeholder
    placeholder = document.createElement('li');
    placeholder.className = "drag-placeholder";
    placeholder.style.height = `${draggedEl.offsetHeight}px`;
    draggedEl.parentNode.insertBefore(placeholder, draggedEl.nextSibling);

    //set most recent cursor coordinates for ghost
    const p = getPoint(e);
    lastPointerX = p.x;
    lastPointerY = p.y;

    moveGhost();

    startAutoScroll();

    //cancel any current swiping gestures
    document.dispatchEvent(new CustomEvent("cancelSwipe", { bubbles: true }));

    if (e.preventDefault) e.preventDefault();
    //logDebug("[beginDrag]");
}

/**
 * Finalizes the drag and re-inserts element in new position.
 * Dispatches `cancelSwipe` to cancel any active swipe gesture.
 */
function endDrag() {
    if (!dragging) return;
    stopAutoScroll();

    //insert dragged element where placeholder is
    placeholder.parentNode.insertBefore(draggedEl, placeholder);
    undoGhost();

    placeholder.remove();

    placeholder = null;
    draggedEl = null;
    dragging = false;
    
    //logDebug("[endDrag]");
}

/**
 * Cancels pending long-press activation timer.
 */
function cancelLongpress() {
    //logDebug("[cancelLongpress]");
    if (longpressTimer) { 
        clearTimeout(longpressTimer); 
        longpressTimer = null; 
    }
}



/** -------------------------------------------------
 * Event Handlers
 * -------------------------------------------------
 */

/**
 * Cancels drag activation if the user moves finger too far before long-press duration.
 * Used only before dragging begins.
 * @param {TouchEvent} e
 */
function onCancelDragTouchMove(e) {
    const p = getPoint(e);

    const dx = p.x - startX;
    const dy = p.y - startY;

    if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
        cancelLongpress();

        document.removeEventListener("touchmove", onCancelDragTouchMove, { passive: false });
    }
}

/**
 * Handles pointer motion during active dragging.
 * Updates ghost position and placeholder order.
 * @param {TouchEvent} e
 */
function onDragTouchMove(e) {

    const p = getPoint(e);
    lastPointerX = p.x;
    lastPointerY = p.y;
    
    if (!dragging) {
        //cancel 
        const dx = lastPointerX - startX;
        const dy = lastPointerY - startY;

        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
            cancelLongpress();
            
            //reset so that you have to hold again from this spot
            startX = lastPointerX;
            startY = lastPointerY;
        }
        return;
    }

    //see this link for fixing the cancerous safari highlight issue
    // https://www.reddit.com/r/webdev/comments/g1wvsb/comment/k327tmc/?force-legacy-sct=1
    e.preventDefault();

    moveGhost();
    updatePlaceholder();
}

/**
 * Called when the user lifts their finger, completing the drag or cancelling.
 */
function onDragTouchEnd() {
    document.body.classList.remove("noselect");

    //logDebug("[onDragTouchEnd]: document classList:", document.body.classList.value);

    cancelLongpress();
    if (dragging) endDrag();

    //cleanup eventlisteners
    document.removeEventListener("touchmove", onDragTouchMove, { passive: false });
    document.removeEventListener("touchend", onDragTouchEnd);
}

/**
 * Handles initial touch, starts long-press detection timer,
 * and sets up cancel and drag listeners.
 * @param {TouchEvent} e
 */
function onDragTouchStart(e) {
    const target = e.target.closest(".list-track-item");
    if (!target) return;

    //see this link for fixing the cancerous safari highlight issue
    // https://www.reddit.com/r/webdev/comments/g1wvsb/comment/k327tmc/?force-legacy-sct=1
    document.body.classList.add("noselect");

    const p = getPoint(e);
    startX = p.x;
    startY = p.y;

    //prep for cancelling the dragging with any significant movement before holding
    cancelLongpress();
    document.addEventListener("touchmove", onCancelDragTouchMove, { passive: false });

    //only triggers after being held without triggering the onCancelDragTouchMove event
    longpressTimer = setTimeout(() => {
        beginDrag(e, target);
        longpressTimer = null;

        //logDebug("[onDragTouchStart]: document classList:", document.body.classList.value);

        //attach the correct drag touchmove
        document.removeEventListener("touchmove", onCancelDragTouchMove, { passive: false });
        document.addEventListener("touchmove", onDragTouchMove, { passive: false });

    }, LONG_PRESS_DURATION);

    document.addEventListener("touchend", onDragTouchEnd);
}


/**
 * Sets up global reorder event listeners.
 * Should be called once after DOM is ready.
 */
export function setupReorderEventListeners() {
    document.addEventListener("touchstart", onDragTouchStart, { passive: true });

    console.log("Reorder listener active");
}
