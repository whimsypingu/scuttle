import { isMobile } from "../utils/device.js";

const toggleButton = document.getElementById("queue-toggle-button");
const playbar = document.getElementById("playbar");

//do this once to save the collapsed height
function measureCollapsedHeight() {
    if (isMobile()) {
        //mobile collapsed height measurement
        const rect = playbar.getBoundingClientRect();
        const styles = getComputedStyle(playbar);
        const marginTop = parseFloat(styles.marginTop) || 0;
        return (rect.height + marginTop);

        // console.log("test", rect.height, marginTop);
        // console.log(window.getComputedStyle(playbar).height);
    } else {
        //desktop collapsed height measurement including button
        const rect = playbar.getBoundingClientRect();
        const butt = toggleButton.getBoundingClientRect();
        const styles = getComputedStyle(playbar);
        const marginTop = parseFloat(styles.marginTop) || 0;
        const marginBottom = parseFloat(styles.marginBottom) || 0;
        return (rect.height + butt.height + marginTop + marginBottom);
    }
}

export const collapsedHeight = measureCollapsedHeight();

