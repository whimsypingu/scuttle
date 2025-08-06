let isCollapsed = true;

const toggleButton = document.getElementById("queue-toggle-button");
const chevron = toggleButton.querySelector("i");
const container = document.getElementById("playbar-and-queue");
const playbar = document.getElementById("custom-playbar");

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
        container.style.height = "80vh";
        chevron.style.transform = "rotate(0deg)";
    }
}

export function initQueueToggle() {
    setHeight();
    toggleButton.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        setHeight();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initQueueToggle();
});
