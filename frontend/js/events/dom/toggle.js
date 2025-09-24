import { isMobile } from "../../utils/index.js";

import { collapsedHeight } from "../../dom/index.js";

let isCollapsed = true;

const toggleButton = document.getElementById("queue-toggle-button");
const container = document.getElementById("playbar-queue");
const playbar = document.getElementById("playbar");
const toast = document.getElementById("toast");
const marginBlock = document.getElementById("title-search-playlists-margin-block");


//set other elements' margin block
function setMarginBlock() {
    marginBlock.style.height = `${collapsedHeight}px`;
}


//toast height
function setToast() {
    toast.style.bottom = `${collapsedHeight}px`;
}


//set the height of the playbar to collapse or exapnded values
function setHeight() {
    if (isCollapsed) {
        container.style.height = `${collapsedHeight}px`;
        container.classList.remove("expanded");
    } else {
        const vh = window.innerHeight;
        container.style.height = `${vh}px`;
        container.classList.add("expanded");
    }
}


//toggle desktop
function setQueueToggleDesktop() {
    toggleButton.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        setHeight();
    });
}

function setQueueToggleMobile() {
    let startY = null;
    let touchIsValid = false;
    const swipeDist = 20;
    const interactiveSelectors = ["input", "button", "li"];

    container.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            startY = e.touches[0].clientY;

            const isInsideContainer = container.contains(e.target);
            const isInsideInteractive = interactiveSelectors.some(sel => e.target.closest(sel));

            touchIsValid = isInsideContainer && !isInsideInteractive;
        }
    });

    container.addEventListener("touchend", (e) => {
        if (startY === null || !touchIsValid) return;

        const endY = e.changedTouches[0].clientY;
        const deltaY = startY - endY;

        //swipe up
        if (deltaY > swipeDist && isCollapsed) {
            //fadeToggle(false);
            isCollapsed = false;
            setHeight();
        }

        //swipe down
        if (deltaY < -swipeDist && !isCollapsed) {
            //fadeToggle(true);
            isCollapsed = true;
            setHeight();
        }

        startY = null;
        touchIsValid = false;
    });

    //allow taps to expand (but not collapse) the playbar and queue
    playbar.addEventListener("click", (e) => {
        if (!isCollapsed) return;

        const isInteractive = interactiveSelectors.some(sel => e.target.closest(sel));
        if (!isInteractive) {
            isCollapsed = false;
            setHeight();
        }
    });

    //prevent fallthrough swiping
    container.addEventListener("touchmove", (e) => {
        if (!touchIsValid) return;

        for (const selector of interactiveSelectors) {
            if (e.target.closest(selector)) {
                return; // don't prevent default for interactive elements
            }
        }
        
        //e.preventDefault() //dont even remember what this was supposed to do anymore fuck; but when i comment it out no warnings hooray
        if (e.cancelable) e.preventDefault(); // this fixed it idk lol
    }, { passive: false });
}


function initQueueToggle() {
    setHeight();
    if (isMobile()) {
        setQueueToggleMobile();
    } else {
        setQueueToggleDesktop();
    }
}

export function setupToggle() {
    initQueueToggle();
    setToast();
    setMarginBlock();
}
