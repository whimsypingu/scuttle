let isCollapsed = true;

const toggleButton = document.getElementById("queue-toggle-button");
const chevron = toggleButton.querySelector("i");
const container = document.getElementById("playbar-and-queue");
const playbar = document.getElementById("custom-playbar");
const queue = document.getElementById("queue-list");

function setHeight() {
    if (isCollapsed) {
        const rect = playbar.getBoundingClientRect();
        const butt = toggleButton.getBoundingClientRect();
        const styles = getComputedStyle(playbar);
        const marginTop = parseFloat(styles.marginTop) || 0;
        const marginBottom = parseFloat(styles.marginBottom) || 0;
        const totalHeight = rect.height + butt.height + marginTop + marginBottom;            
        container.style.height = `${totalHeight}px`;
        chevron.style.transform = "rotate(180deg)";
    } else {
        container.style.height = "100vh";
        chevron.style.transform = "rotate(0deg)";
    }
}

export function initQueueToggle() {
    setHeight();
    toggleButton.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        setHeight();
    });

    let startY = null;
    const swipeDist = 20;

    container.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            startY = e.touches[0].clientY;
        }
    });

    container.addEventListener("touchend", (e) => {
        if (startY === null) return;

        const endY = e.changedTouches[0].clientY;
        const deltaY = startY - endY;

        //swipe up
        if (deltaY > swipeDist && isCollapsed) {
            isCollapsed = false;
            setHeight();
        }

        //swipe down
        if (deltaY < -swipeDist && !isCollapsed) {
            isCollapsed = true;
            setHeight();
        }

        startY = null;
    });

    //prevent fallthrough swiping
    container.addEventListener("touchmove", (e) => {
        if (queue.contains(e.target)) {
            return;
        }

        e.preventDefault();
    }, { passive: false });
}

document.addEventListener("DOMContentLoaded", () => {
    initQueueToggle();
});
