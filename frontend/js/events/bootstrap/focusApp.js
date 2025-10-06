import { logDebug } from "../../utils/debug.js";

import { onRefocus, onBackgrounded } from "../../features/audio/controller.js";

export async function setupRefocus() {
    document.addEventListener("visibilitychange", () => {

        //return to the page
        if (document.visibilityState === "visible") {
            logDebug("[VISIBILITY] Page became VISIBLE — refocus triggered.");
            onRefocus();
        }

        else if (document.visibilityState === "hidden") {
            logDebug("[VISIBILITY] Page became HIDDEN — likely backgrounded.");
            onBackgrounded();
        }
    });
}