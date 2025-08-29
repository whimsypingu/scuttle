import { domEls } from "../../dom/selectors.js";

import { 
    onSwipe
} from "../../features/playlist/controller.js";



let startX = 0;
let deltaX = 0;
let maxSwipe = null;
let flipThreshold1 = null;
let flipThreshold2 = null;

let startY = 0;
let deltaY = 0;
let verticalThreshold = null;

let isSwiping = false;
let swipeDirection = null; // "left" "right" null
let activeEl = null;

//handles the state of mobile swipeable actions states
//consider some kind of action handler that determines inner icon and color
function setSwipeTheme(el, absX, theme1, theme2) {
    if (absX > flipThreshold2) {
        el.dataset.swipeTheme = theme2;
    } else if (absX > flipThreshold1) {
        el.dataset.swipeTheme = theme1;
    } else {
        delete el.dataset.swipeTheme;
    }
}
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
        if (!swipeDirection && Math.abs(deltaX) > 5) {
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
                onSwipe(domEls, activeEl.dataset, "queue"); //this works for both library and queue??
            }
        } else {
            //swipe left
            if (isValidSwipe2) {
                onSwipe(domEls, activeEl.dataset, "more");
            } else if (isValidSwipe1) {
                onSwipe(domEls, activeEl.dataset, "like");
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
