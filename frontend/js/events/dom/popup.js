//static/js/events/dom/popup.js

import { popupDomEls } from "../../dom/index.js";
import { hidePopupOnClick, showCreatePlaylistPopup } from "../../features/popup/controller.js";

export function setupPopupListeners() {
    popupDomEls.createPlaylistButtonEl.addEventListener("click", () => showCreatePlaylistPopup());

    popupDomEls.popupOverlayEl.addEventListener("click", (e) => hidePopupOnClick(e));
}
