import { 
    onSwipe
} from "../../features/playlist/controller.js";
import { logDebug } from "../../utils/debug.js";


/**
 * -------------------------------------------------
 * Swipe Interaction Module
 * -------------------------------------------------
 * 
 * This module implements horizontal swipe gestures for track list items
 * in a playlist or search dropdown. It handles:
 *   - Locking swipe direction after a threshold
 *   - Canceling swipe if vertical motion dominates
 *   - Updating the "revealed" background actions dynamically
 *   - Determining primary vs secondary (deep) actions based on swipe distance
 *   - Executing corresponding track actions (queue, like, more, etc.)
 * 
 * Features:
 *   - Configurable swipe thresholds based on element width
 *   - Theme and icon updates for revealed actions
 *   - Flexible support for left/right, deep/normal actions
 *   - Single active swipe at a time
 * 
 * Usage:
 *   setupSwipeEventListeners() should be called once after the DOM is ready.
 *   Track list items must have data attributes:
 *     data-track-id
 *     data-left, data-left-deep, data-right, data-right-deep (optional)
 * 
 * Example:
 *   <li class="list-track-item" data-track-id="123" data-left="queue" data-right="like">
 *     ...
 *   </li>
 * Implements horizontal swipe gestures for track list items.
 * 
 * 
 * Swipe semantics:
 *   - swipeDir: the **direction the user swiped** (left/right) // this is consistent throughout the project
 *   - revealed side: the side of the element that is exposed during swipe
 *       - swipe right => foreground moves right => reveals the left action (which is labeled "right")
 *       - swipe left  => foreground moves left  => reveals the right action (which is labeled "left")
 * 
 * Thresholds:
 *   - SWIPE_LOCK_THRESHOLD: horizontal distance before locking swipe direction
 *   - SWIPE_VERTICAL_CANCEL_THRESHOLD: vertical movement limit to cancel swipe
 *   - normalThreshold: distance required to trigger the "normal" action
 *   - deepThreshold: distance required to trigger the secondary/deep action
 */



/** -------------------------------------------------
 * State Variables
 * -------------------------------------------------
 * Used internally to track swipe state.
 */
let startX = 0;
let deltaX = 0;

//these get set based on the element
let maxSwipe = null;
let normalThreshold = null;
let deepThreshold = null;

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



/** -------------------------------------------------
 * Helpers
 * -------------------------------------------------
 */

/**
 * Mapping from action names to icons and theme classes.
 * Used to update the revealed swipe background.
 */
const iconMapping = {
    queue: {
        icon: "fa fa-plus-square",
        theme: "theme-queue",
    },
    queueFirst: {
        icon: "fa fa-plus-circle",
        theme: "theme-queue-first",
    },
    like: {
        icon: "fa fa-heart",
        theme: "theme-like",
    },
    more: {
        icon: "fa fa-ellipsis-h",
        theme: "theme-more",
    },
    remove: {
        icon: "fa fa-trash",
        theme: "theme-more",
    }
}

/**
 * Retrieve the icon and theme for a given action name.
 * @param {string} actionName
 * @returns {{icon: string, theme: string}}
 */
function getActionIconAndTheme(actionName) {
    return iconMapping[actionName] || { 
        icon: "fa fa-question",
        theme: "theme-unknown",
    };
}

/**
 * Apply theme and icon to the .swipe-action element based on swipe distance.
 * @param {HTMLElement} el - The .swipe-action element.
 * @param {number} swipeDist - Absolute horizontal swipe distance.
 * @param {string} normalAction - Primary action name.
 * @param {string|null} deepAction - Secondary action name (optional).
 * 
 * Behavior:
 *   - If swipeDist >= deepThreshold and deepAction is provided, the deep action is applied.
 *   - Else if swipeDist >= normalThreshold, the normal action is applied.
 *   - Else, the element is reset (theme removed, icon set to normalAction's default).
 * 
 * Notes:
 *   - Requires global variables `normalThreshold` and `deepThreshold` to be set.
 *   - Uses getActionIconAndTheme(actionName) to determine which icon and theme to apply.
 *   - Stores the applied theme in `el.dataset.swipeTheme`.
*/
function setSwipeTheme(el, swipeDist, normalAction, deepAction = null) {
    const iconEl = el.querySelector("i");

    //determine which action should be applied
    const useDeep = deepAction && swipeDist >= deepThreshold;
    const useNormal = swipeDist >= normalThreshold;

    const action = useDeep ? deepAction : (useNormal ? normalAction : null); //tries deepAction if possible with fallback

    if (action) {
        //apply icon and theme for action
        const { icon, theme } = getActionIconAndTheme(action);
        el.dataset.swipeTheme = theme;
        iconEl.className = icon;
    } else {
        //reset visual state if thresholds not met
        delete el.dataset.swipeTheme;
        const { icon } = getActionIconAndTheme(normalAction);
        iconEl.className = icon;
    }
}


/**
 * Determine which action should be triggered for a swipe event.
 * Prefers deepAction if available and threshold is reached.
 * @param {HTMLElement} el - The element being swiped
 * @param {"left"|"right"} swipeDir
 * @param {boolean} isNormal - Whether normal threshold was crossed
 * @param {boolean} isDeep - Whether deep threshold was crossed
 * @returns {string|null} The action name to execute
 * 
 * Behavior:
 *   - If the swipe did not reach the normal threshold, returns null (no action).
 *   - If the swipe reached the deep threshold and a deep action exists in the dataset, returns the deep action.
 *   - Otherwise, returns the normal action from the dataset.
 *
 * Notes:
 *   - Relies on the element having dataset properties named according to the convention:
 *       "left", "right", "leftDeep", "rightDeep".
 */
function getSwipeActionName(el, swipeDir, isNormal, isDeep) {
    if (!isNormal) {
        return null; //swipe too short, no action
    }

    const deepKey = `${swipeDir}Deep`; //leftDeep or rightDeep
    const normalKey = swipeDir;

    //use deep action if available
    if (isDeep && el.dataset[deepKey]) {
        return el.dataset[deepKey];
    }

    //fallback
    return el.dataset[normalKey] || null;
}



/**
 * Update the swipe background area behind the list item.
 * Adjusts transform, width, opacity, and theme/icon.
 * @param {"left"|"right"} swipeDir
 * @param {number} swipeDist
 * 
 * Behavior:
 *   - Moves the foreground element with a CSS transform to reveal the swipe action.
 *   - Updates the width and opacity of the corresponding `.swipe-action` element.
 *   - Sets the theme and icon of the action area according to thresholds:
 *       - Normal swipe threshold → normal action
 *       - Deep swipe threshold → deep action (if defined)
 * 
 * Notes:
 *   - Expects `activeEl` to be set to the currently swiped `.list-track-item`.
 *   - Relies on dataset properties of `activeEl`:
 *       `left`, `leftDeep`, `right`, `rightDeep` to determine available actions.
 *   - `marginOffset` is applied to the transform to leave spacing from the edge.
 *   - The width of the action element dynamically matches the swipe distance.
 * 
 * Example:
 *   updateSwipeBackground("left", 80); // reveal left swipe area by 80px
*/
function updateSwipeBackground(swipeDir, swipeDist) {
    if (!activeEl) return;

    const foreground = activeEl.querySelector(".foreground");
    const marginOffset = "var(--space-xxl)"; //css variable interpreted as "####px"

    //swipe direction
    const config = {
        right: {
            el: ".swipe-action.right", //right swipe => reveal left side, which is labeled as right
            transform: dist => `translateX(calc(${dist}px + ${marginOffset}))`,
            normalAction: activeEl.dataset.right,
            deepAction: activeEl.dataset.rightDeep,
        },
        left: {
            el: ".swipe-action.left",
            transform: dist => `translateX(calc(-${dist}px - ${marginOffset}))`,
            normalAction: activeEl.dataset.left,
            deepAction: activeEl.dataset.leftDeep,
        },
    }
    
    const c = config[swipeDir];
    const el = activeEl.querySelector(c.el);

    //move foreground element
    foreground.style.transform = swipeDist > 0 ? c.transform(swipeDist) : "translateX(0)";
    
    //update theme and icon for each action
    setSwipeTheme(el, swipeDist, c.normalAction, c.deepAction);

    //update width and visibility of revealed action area
    el.style.width = `${swipeDist}px`;
    el.style.opacity = swipeDist > 0 ? "1" : "0";
}


/**
 * Reset swipe visual state for the active element.
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
    maxSwipe = normalThreshold = deepThreshold = 0;
    trueAbsSwipeDist = null;
}


/** -------------------------------------------------
 * Event Handlers
 * -------------------------------------------------
 */

/**
 * Sets up global swipe event listeners for all .list-track-item elements.
 * Handles touchstart, touchmove, and touchend gestures.
 * Should be called once after the DOM is ready.
 */
export function setupSwipeEventListeners() {
    // Touch start
    document.addEventListener("touchstart", e => {
        const target = e.target.closest(".list-track-item");
        if (!target) return;

        activeEl = target;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        maxSwipe = activeEl.offsetWidth * 0.6;
        normalThreshold = maxSwipe * 0.4;
        deepThreshold = maxSwipe * 0.8;

        swipeDirection = null;
        activeEl.classList.add("swiping");
    });

    // Touch move
    document.addEventListener("touchmove", e => {
        if (!activeEl) return;

        //calculate distance moved from initial touch
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

            swipeDirection = deltaX > 0 ? "right" : "left"; //determine swipe direction

            e.preventDefault(); //prevent background scroll if there is any
        } else {
            //logDebug("swipeDirection: null");
            
            //direction not yet locked, reset visuals
            swipeDirection = null;
            updateSwipeBackground("left", 0);
            updateSwipeBackground("right", 0);
            return;
        }

        // Animate background only after direction is locked
        //this is the actual swipe distance, clamped
        //begins after direction is locked, capped by maximum swipe distance
        trueAbsSwipeDist = Math.min(Math.max(Math.abs(deltaX) - SWIPE_LOCK_THRESHOLD, 0), maxSwipe);

        updateSwipeBackground(swipeDirection, trueAbsSwipeDist);
    });

    // Touch end
    document.addEventListener("touchend", () => {
        if (!activeEl) return;

        // Cancel if swipe direction wasn't locked or swipe is too short
        if (!swipeDirection) {
            resetSwipeState();
            return;
        }

        //determine thresholds
        const isDeep = trueAbsSwipeDist >= deepThreshold;       //secondary action
        const isNormal = trueAbsSwipeDist >= normalThreshold;   //primary action

        const actionName = getSwipeActionName(activeEl, swipeDirection, isNormal, isDeep);
        if (actionName) {

            //execute swipe action handler: see frontend/js/features/playlist/controller.js
            onSwipe(activeEl.dataset.trackId, actionName);

            logDebug("actionName:", actionName);
        }

        //reset swipe state and visuals
        resetSwipeState();
    }, { passive: false });

    console.log("Swipe listener active");
}



