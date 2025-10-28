import { logDebug } from "../../utils/debug.js";


/**
 * -------------------------------------------------
 * Reorder Event Handlers
 * -------------------------------------------------
 * Enables long-press + drag reordering for .list-track-item elements
 * inside scrollable lists. Uses a single global event listener (delegation).
 */
const LONG_PRESS_DURATION = 300; //ms
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
let rafId = null;


// -------------------------------
// Utility
// -------------------------------
function getPoint(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

function itemFromPoint(x, y) {
    let elem = document.elementFromPoint(x, y);
    if (!elem) return null;

    const item = elem.closest('.list-track-item');
    // optionally ignore ghost and placeholder
    if (item && item !== draggedEl && item !== placeholder) return item;
    return null;
}

function moveGhost() {
    if (!draggedEl) return;
    draggedEl.style.left = `${lastPointerX}px`;
    draggedEl.style.top = `${lastPointerY}px`;
}

function undoGhost() {
    draggedEl.classList.remove('dragging');

    //manually revert
    draggedEl.style.position = '';
    draggedEl.style.top = '';
    draggedEl.style.left = '';
    draggedEl.style.width = '';
    draggedEl.style.zIndex = '';
    draggedEl.style.pointerEvents = '';
    draggedEl.style.boxShadow = '';
    draggedEl.style.borderRadius = '';
    draggedEl.style.transform = '';  // reset the translate(-50%, -50%) 
}

function updatePlaceholder() {
    const target = itemFromPoint(lastPointerX, lastPointerY);
    if (target && target !== placeholder && target !== draggedEl) {
        const rect = target.getBoundingClientRect();
        const before = (lastPointerY < rect.top + rect.height / 2);
        if (before) target.parentNode.insertBefore(placeholder, target);
        else target.parentNode.insertBefore(placeholder, target.nextSibling);
    }
}


// -------------------------------
// Auto-scroll
// -------------------------------
function autoScrollStep() {
    if (!dragging) { autoScrollActive = false; return; }
    const list = placeholder.parentNode;
    const rect = list.getBoundingClientRect();
    const y = lastPointerY;

    if (y < rect.top + AUTOSCROLL_MARGIN) list.scrollTop -= AUTOSCROLL_SPEED;
    else if (y > rect.bottom - AUTOSCROLL_MARGIN) list.scrollTop += AUTOSCROLL_SPEED;

    moveGhost();
    updatePlaceholder();

    rafId = requestAnimationFrame(autoScrollStep);
}

function startAutoScroll() {
    if (!autoScrollActive) {
        autoScrollActive = true;
        rafId = requestAnimationFrame(autoScrollStep);
    }
}

function stopAutoScroll() {
    autoScrollActive = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}




function beginDrag(e, el) {
    dragging = true;
    draggedEl = el;
    draggedEl.classList.add("dragging");

    //placeholder
    placeholder = document.createElement('li');
    placeholder.className = "drag-placeholder";
    placeholder.style.height = `${draggedEl.offsetHeight}px`;
    draggedEl.parentNode.insertBefore(placeholder, draggedEl.nextSibling);

    //ghost
    //draggedEl.classList.add("drag-ghost");

    const p = getPoint(e);
    lastPointerX = p.x;
    lastPointerY = p.y;

    moveGhost();

    startAutoScroll();

    if (e.preventDefault) e.preventDefault();

    //document.body.classList.add("noselect");
    logDebug("[beginDrag]");
}

function endDrag() {
    if (!dragging) return;
    stopAutoScroll();

    // insert dragged element where placeholder is
    placeholder.parentNode.insertBefore(draggedEl, placeholder);
    undoGhost();

    placeholder.remove();

    placeholder = null;
    draggedEl = null;
    dragging = false;
    
    //document.body.classList.remove("noselect");
    logDebug("[endDrag]");
}

function cancelLongpress() {
    if (longpressTimer) { 
        clearTimeout(longpressTimer); 
        longpressTimer = null; 
    }
}


function onMove(e) {
    //see this link for fixing the cancerous safari highlight issue
    // https://www.reddit.com/r/webdev/comments/g1wvsb/comment/k327tmc/?force-legacy-sct=1
    e.preventDefault();

    const p = getPoint(e);
    lastPointerX = p.x;
    lastPointerY = p.y;
    
    if (!dragging) {
        //cancel longpress
        if ((Math.abs(lastPointerY - startY)) > MOVE_THRESHOLD) cancelLongpress();
        return;
    }

    moveGhost();
    updatePlaceholder();
}


function onStart(e) {
    const target = e.target.closest(".list-track-item");
    if (!target) return;

    //see this link for fixing the cancerous safari highlight issue
    // https://www.reddit.com/r/webdev/comments/g1wvsb/comment/k327tmc/?force-legacy-sct=1
    document.body.classList.add("noselect");

    const p = getPoint(e);
    startX = p.x;
    startY = p.y;

    cancelLongpress();
    longpressTimer = setTimeout(() => {
        beginDrag(e, target);
        longpressTimer = null;
    }, LONG_PRESS_DURATION);

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
}

function onEnd() {
    document.body.classList.remove("noselect");

    cancelLongpress();
    if (dragging) endDrag();

    window.removeEventListener("touchmove", onMove, { passive: false });
    window.removeEventListener("touchend", onEnd);
}




/**
 * Sets up global reorder event listeners.
 * Should be called once after DOM is ready.
 */
export function setupReorderEventListeners() {
    document.addEventListener("touchstart", onStart, { passive: false });

    console.log("Reorder listener active");
}
