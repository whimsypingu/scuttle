import { buildCreatePlaylistPopup } from "../../dom/builder.js";
import { hidePopup, showPopup } from "./index.js";

import { logDebug } from "../../utils/debug.js";


export function hidePopupOnClick(e, domEls) {
    const { popupOverlayEl } = domEls;
    if (e.target === popupOverlayEl) hidePopup(popupOverlayEl);
}

export function showCreatePlaylistPopup(domEls) {
    const { popupOverlayEl, popupEl } = domEls;

    //clear old popup and set to a new fresh one
    popupEl.innerHTML = "";

    const newPopupEl = buildCreatePlaylistPopup();
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".cancel");
    cancelButton.addEventListener("click", () => {
        hidePopup(popupOverlayEl);
    });

    const createPlaylistButton = newPopupEl.querySelector(".create-playlist");
    createPlaylistButton.addEventListener("click", () => {
        logDebug("create playlist triggered"); //more logic here required
        hidePopup(popupOverlayEl);
    })

    //show
    showPopup(popupOverlayEl);
}


export function showEditPlaylistPopup(popupOverlayEl) {
    logDebug("fill me in");
}
