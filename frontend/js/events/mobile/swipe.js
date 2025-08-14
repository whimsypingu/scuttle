const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

let startX = 0;
let deltaX = 0;
let maxSwipe = null;
let flipThreshold = null;

let startY = 0;
let deltaY = 0;
let verticalThreshold = null;

let isSwiping = false;
let swipeDirection = null; // "left" "right" null
let activeEl = null;

//handles the state of mobile swipeable actions states
function setBg(side, opacity = "0", absX = 0) {
    let el = null;
    const foreground = activeEl.querySelector(".foreground");

    const marginOffset = "var(--space-xxl)";
    if (side == "left") {
        el = activeEl.querySelector(".swipe-action.left");
        if (absX > 0) {
            foreground.style.transform = `translateX(calc(${absX}px + ${marginOffset}))`;
        } else {
            foreground.style.transform = `translateX(0px)`;
        }
    } else {
        el = activeEl.querySelector(".swipe-action.right");
        if (absX > 0) {
            foreground.style.transform = `translateX(calc(-${absX}px - ${marginOffset}))`;
        } else {
            foreground.style.transform = `translateX(0px)`;
        }
    }

    el.style.width = `${absX}px`;
    el.style.opacity = opacity;

    if (absX > flipThreshold) {
        el.classList.add("flip-color");
    } else {
        el.classList.remove("flip-color");
    }
}

export function setupSwipeEventListeners() {
    document.addEventListener('touchstart', e => {
        const target = e.target.closest('.list-track-item');
        if (!target) return;

        activeEl = target;

        startX = e.touches[0].clientX;
        deltaX = 0;
        maxSwipe = activeEl.offsetWidth / 2; //how much swipe space is available
        flipThreshold = activeEl.offsetWidth / 3; //at which point swipe is complete

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
        const maxWidth = `${absX}px`;

        //swipe right
        if (deltaX > 0) {
            setBg("left", "1", absX);
        } else {
            setBg("right", "1", absX);
        }
    });

    document.addEventListener('touchend', () => {
        if (!isSwiping || !activeEl) return;

        const isValidSwipe = Math.abs(deltaX) >= flipThreshold;

        if (deltaX > 0) {
            //swipe to the right
            setBg("left");

            if (isValidSwipe) {
                console.log("queued");
            }
        } else {
            //swipe left
            setBg("right");

            if (isValidSwipe) {
                console.log("liked");
            }
        }

        // Reset references for next swipe
        isSwiping = false;
        swipeDirection = null;

        activeEl.classList.remove('swiping');
        activeEl = null;
        deltaX = 0;
    });

    console.log("Swipe listener active");
}
