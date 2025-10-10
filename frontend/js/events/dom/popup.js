//static/js/events/dom/popup.js

import { popupDomEls } from "../../dom/index.js";
import { hidePopupOnClick, showCreatePlaylistPopup } from "../../features/popup/controller.js";

export function setupPopupListeners() {
    popupDomEls.createPlaylistButtonEl.addEventListener("click", () => showCreatePlaylistPopup());

    popupDomEls.popupOverlayEl.addEventListener("click", (e) => hidePopupOnClick(e));

    // Observe content changes
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                console.log("Popup overlay children changed:", mutation);
            } else if (mutation.type === "characterData") {
                console.log("Popup overlay text changed:", mutation);
            }
        }
    });

    observer.observe(popupDomEls.popupOverlayEl, {
        childList: true,    // tracks added/removed elements
        subtree: true,      // tracks all nested elements
        characterData: true // tracks text changes
    });
}
