import { initEvents } from "./events/index.js";

import { logDebug } from "./utils/debug.js";

// window.addEventListener("DOMContentLoaded", () => {
// 	logDebug("HELLO");
// 	initEvents();
// });

function main() {
	logDebug("HELLO WORLD");
    initEvents();
}

// run immediately if DOM is already ready, otherwise wait
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}