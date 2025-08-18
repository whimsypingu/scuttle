import { initEvents } from "./events/index.js";

import { logDebug } from "./utils/debug.js";

// window.addEventListener("DOMContentLoaded", () => {
// 	logDebug("HELLO");
// 	initEvents();
// });


window.addEventListener("DOMContentLoaded", async () => {
    logDebug("HELLO WORLD");
    initEvents();

    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                "/sw.js",
                { scope: "/" } // scope covers the whole site
            );
            logDebug("Service Worker registered with scope:", registration.scope);
            navigator.serviceWorker.addEventListener("message", event => {
                if (event.data.type === "log") {
                    console.log("[SW]", event.data.msg);
                }
            });
        } catch (err) {
            logDebug("Service Worker registration failed:", err);
        }
    }
});