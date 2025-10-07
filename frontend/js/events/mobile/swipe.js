import { 
    onSwipe
} from "../../features/playlist/controller.js";
import { logDebug } from "../../utils/debug.js";


// -------------------------------------------------
// State variables
// -------------------------------------------------
let startX = 0;
let deltaX = 0;

//these get set based on the element
let maxSwipe = null;
let flipThreshold1 = null;
let flipThreshold2 = null;

let startY = 0;
let deltaY = 0;

const SWIPE_LOCK_THRESHOLD = 30; //px before committing to horizontal swipe animation
const SWIPE_VERTICAL_CANCEL_THRESHOLD = 50; //px before canceling due to vertical swipe

//contains the current element being swiped on
let activeEl = null;

// "left" | "right" | null
// this variable is kind ofa T/F lock on swiping or not
// holds the direction of the swipe
let swipeDirection = null; 

// upon a valid swipe being started, this is how much the actual swipe has moved
let trueAbsSwipeDist = null;


// -------------------------------------------------
// Helpers
// -------------------------------------------------

/**
 * Apply swipe theme (background color/icon state) based on swipe distance.
 * @param {HTMLElement} el - The swipe action element.
 * @param {number} swipeDist - Absolute horizontal distance of the swipe.
 * @param {string} theme1 - Theme for "primary" swipe threshold.
 * @param {string} theme2 - Theme for "secondary" (deeper) swipe threshold.
 */
function setSwipeTheme(el, swipeDist, theme1, theme2) {
    if (swipeDist >= flipThreshold2) {
        el.dataset.swipeTheme = theme2;
    } else if (swipeDist >= flipThreshold1) {
        el.dataset.swipeTheme = theme1;
    } else {
        delete el.dataset.swipeTheme;
    }
}

/**
 * Update swipe background visuals (the "revealed" action area behind the item).
 * Requires activeEl to be set.
 * @param {"left"|"right"} side - Which side to reveal.
 * @param {number} swipeDist - How much to reveal.
 */
function updateSwipeBackground(side, swipeDist) {
    const foreground = activeEl.querySelector(".foreground");
    const marginOffset = "var(--space-xxl)";

    let el = null;

    if (side === "left") {
        el = activeEl.querySelector(".swipe-action.left");

        foreground.style.transform =
            swipeDist > 0 ? `translateX(calc(${swipeDist}px + ${marginOffset}))` : "translateX(0)";

        //color
        setSwipeTheme(el, swipeDist, "green1", "tan1");
    } else {
        el = activeEl.querySelector(".swipe-action.right");

        foreground.style.transform =
            swipeDist > 0 ? `translateX(calc(-${swipeDist}px - ${marginOffset}))` : "translateX(0)";

        //color
        setSwipeTheme(el, swipeDist, "green1", "red1");
    }

    el.style.width = `${swipeDist}px`;
    el.style.opacity = swipeDist > 0 ? "1" : "0";
}


/**
 * Reset swipe visual state.
 */
function resetSwipeVisuals() {
    if (!activeEl) return;
    updateSwipeBackground("left", 0);
    updateSwipeBackground("right", 0);
    activeEl.classList.remove("swiping");
}


/**
 * Fully reset swipe interaction state.
 */
function resetSwipeState() {
    resetSwipeVisuals();

    swipeDirection = null;
    activeEl = null;
    startX = startY = deltaX = deltaY = 0;
    maxSwipe = flipThreshold1 = flipThreshold2 = 0;
    trueAbsSwipeDist = null;
}


// --------------------
// Event Handlers
// --------------------

export function setupSwipeEventListeners() {
    // Touch start
    document.addEventListener("touchstart", e => {
        const target = e.target.closest(".list-track-item");
        if (!target) return;

        activeEl = target;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        maxSwipe = activeEl.offsetWidth * 0.6;
        flipThreshold1 = maxSwipe * 0.4;
        flipThreshold2 = maxSwipe * 0.8;

        swipeDirection = null;
        activeEl.classList.add("swiping");
    });

    // Touch move
    document.addEventListener("touchmove", e => {
        if (!activeEl) return;

        deltaX = e.touches[0].clientX - startX;
        deltaY = e.touches[0].clientY - startY;

        // Cancel swipe if vertical motion dominates
        if (Math.abs(deltaY) > SWIPE_VERTICAL_CANCEL_THRESHOLD) {
            resetSwipeState();
            return;
        }

        // Lock direction only after horizontal threshold is exceeded
        if (Math.abs(deltaX) > SWIPE_LOCK_THRESHOLD) {
            //logDebug("swipeDirection:", swipeDirection);

            swipeDirection = deltaX > 0 ? "right" : "left";

            e.preventDefault(); //prevent background scroll if there is any
        } else {
            //logDebug("swipeDirection: null");

            swipeDirection = null;
            updateSwipeBackground("left", 0);
            updateSwipeBackground("right", 0);
            return;
        }

        // Animate background only after direction is locked
        trueAbsSwipeDist = Math.min(Math.max(Math.abs(deltaX) - SWIPE_LOCK_THRESHOLD, 0), maxSwipe);

        if (swipeDirection === "right") {
            updateSwipeBackground("left", trueAbsSwipeDist);
        } else {
            updateSwipeBackground("right", trueAbsSwipeDist);
        }
    });

    // Touch end
    document.addEventListener("touchend", () => {
        if (!activeEl) return;

        // Cancel if swipe direction wasn't locked or swipe is too short
        if (!swipeDirection) {
            resetSwipeState();
            return;
        }

        const isSecondary = trueAbsSwipeDist >= flipThreshold2;
        const isPrimary = trueAbsSwipeDist >= flipThreshold1;

        if (swipeDirection === "right") {
            if (isSecondary) {
                logDebug("SWIPE SECONDARY ACTION RIGHT");
            } else if (isPrimary) {
                logDebug("SWIPE PRIMARY ACTION RIGHT");
                onSwipe(activeEl.dataset, "queue");
            }
        } else {
            if (isSecondary) {
                logDebug("SWIPE SECONDARY ACTION LEFT");
                onSwipe(activeEl.dataset, "more");
            } else if (isPrimary) {
                logDebug("SWIPE PRIMARY ACTION LEFT");
                onSwipe(activeEl.dataset, "like");
            }
        }

        resetSwipeState();
    }, { passive: false });

    console.log("Swipe listener active");
}










/*

function setBg(side, opacity = "0", absX = 0) {
    let el = null;
    const foreground = activeEl.querySelector(".foreground");

    const marginOffset = "var(--space-xxl)"; //dude i dont even remember what this is for

    //swipe to the right, exposing the left side
    if (side == "left") {
        el = activeEl.querySelector(".swipe-action.left");
        if (absX > 0) {
            foreground.style.transform = `translateX(calc(${absX}px + ${marginOffset}))`;
        } else {
            foreground.style.transform = `translateX(0px)`;
        }

        //color
        setSwipeTheme(el, absX, "green1", "tan1");
    } else {
        el = activeEl.querySelector(".swipe-action.right");
        if (absX > 0) {
            foreground.style.transform = `translateX(calc(-${absX}px - ${marginOffset}))`;
        } else {
            foreground.style.transform = `translateX(0px)`;
        }

        //color
        setSwipeTheme(el, absX, "green1", "red1");
    }

    el.style.width = `${absX}px`;
    el.style.opacity = opacity;
}

export function setupSwipeEventListeners() {
    document.addEventListener('touchstart', e => {
        const target = e.target.closest('.list-track-item');
        if (!target) return;

        activeEl = target;

        startX = e.touches[0].clientX;
        deltaX = 0;
        maxSwipe = activeEl.offsetWidth * 0.6; //how much swipe space is available
        flipThreshold1 = maxSwipe * 0.5; //at which point swipe is complete
        flipThreshold2 = maxSwipe * 0.9;

        console.log(maxSwipe);

        startY = e.touches[0].clientY;
        deltaY = 0;
        verticalThreshold = activeEl.offsetHeight * 3; //cancel swipe due to significant vertical motion

        isSwiping = true;
        swipeDirection = null;
        activeEl.classList.add('swiping');
    });

    document.addEventListener('touchmove', e => {
        if (!isSwiping || !activeEl) return;

        deltaX = e.touches[0].clientX - startX;
        deltaY = e.touches[0].clientY - startY;

        //ignore if vertical swipe is stronger
        if (Math.abs(deltaY) > verticalThreshold) {
            setBg("left");
            setBg("right");

            isSwiping = false;
            swipeDirection = null;
            return;
        }

        //lock direction on first significant movement
        if (!swipeDirection && Math.abs(deltaX) > swipeLockThreshold) {
            swipeDirection = deltaX > 0 ? "right" : "left";
        }

        // if moving opposit from locked direction ignore
        if ((swipeDirection === "left" && deltaX > 0) ||
            (swipeDirection === "right" && deltaX < 0)) {
            return;
        }

        const absX = Math.min(Math.abs(deltaX), maxSwipe);

        //swipe right
        if (deltaX > 0) {
            setBg("left", "1", absX);
        } else {
            setBg("right", "1", absX);
        }
    });

    document.addEventListener('touchend', () => {        
        //unconditionally set bg to 0 to try to catch leaky ui
        if (!activeEl) return;
        setBg("left");
        setBg("right");

        if (!isSwiping) return;
        const isValidSwipe2 = Math.abs(deltaX) >= flipThreshold2; //deeper secondary action
        const isValidSwipe1 = Math.abs(deltaX) >= flipThreshold1;

        if (deltaX > 0) {
            //swipe to the right
            if (isValidSwipe2) {
                console.log("SWIPE SECONDARY ACTION TO THE RIGHT");
            } else if (isValidSwipe1) {
                onSwipe(activeEl.dataset, "queue"); //this works for both library and queue??
            }
        } else {
            //swipe left
            if (isValidSwipe2) {
                onSwipe(activeEl.dataset, "more");
            } else if (isValidSwipe1) {
                onSwipe(activeEl.dataset, "like");
            }
        }

        // Reset references for next swipe
        isSwiping = false;
        swipeDirection = null;

        activeEl.classList.remove('swiping');
        activeEl = null;
        deltaX = 0;
    }, { passive: false });

    console.log("Swipe listener active");
}
*/