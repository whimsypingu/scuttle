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
        console.log("test", rect.height, marginTop, styles);
        console.log(window.getComputedStyle(playbar).height);

        return (rect.height + marginTop);
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

//export const collapsedHeight = measureCollapsedHeight();

export let collapsedHeight = 0;

const ro = new ResizeObserver((entries, observer) => {
    for (let entry of entries) {
        const measured = measureCollapsedHeight();
        
        // Only accept the measurement if the browser has actually 
        // given the element a height (avoids 0px initial states)
        if (measured > 0) {
            collapsedHeight = measured;
            console.log("Final collapsedHeight locked in:", collapsedHeight);
            
            //stop observing immediately to prevent further calculations with playbar height changes
            observer.disconnect(); 
        }
    }
});

//start observing the playbar, will disconnect after first valid measurement
ro.observe(playbar);