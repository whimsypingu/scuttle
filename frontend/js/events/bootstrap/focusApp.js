import { logDebug } from "../../utils/debug.js";

import { onRefocus } from "../../features/audio/controller.js";

export async function setupRefocus() {
    document.addEventListener("visibilitychange", () => {

        //return to the page
        if (document.visibilityState === "visible") {
            logDebug("REFOCUS TRIGGERED.");
            onRefocus();
        }
    });
}