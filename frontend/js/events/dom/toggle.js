import { isMobile } from "../../utils/index.js";

let isCollapsed = true;

const toggleButton = document.getElementById("queue-toggle-button");
const container = document.getElementById("playbar-queue");
const playbar = document.getElementById("playbar");

//do this once to save the collapsed height
let totalHeight = 0;
function measureCollapsedHeight() {
    if (isMobile()) {
        //mobile collapsed height measurement
        const rect = playbar.getBoundingClientRect();
        const styles = getComputedStyle(playbar);
        const marginTop = parseFloat(styles.marginTop) || 0;
        totalHeight = rect.height + marginTop;
    } else {
        //desktop collapsed height measurement
        const rect = playbar.getBoundingClientRect();
        const butt = toggleButton.getBoundingClientRect();
        const styles = getComputedStyle(playbar);
        const marginTop = parseFloat(styles.marginTop) || 0;
        const marginBottom = parseFloat(styles.marginBottom) || 0;
        totalHeight = rect.height + butt.height + marginTop + marginBottom;
    }
}
measureCollapsedHeight();

//set the height of the playbar to collapse or exapnded values
function setHeight() {
    if (isCollapsed) {
        container.style.height = `${totalHeight}px`;
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
        e.preventDefault();
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
}
