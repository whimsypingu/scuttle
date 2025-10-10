/**
 * Hides a popup overlay with a fade-out transition.
 * Waits for the CSS transition on the overlay's opacity to finish
 * before removing the popup content from the DOM.
 *
 * @param {HTMLElement} popupEl - The inner popup element containing content to remove.
 * @param {HTMLElement} popupOverlayEl - The overlay element that will fade out.
 * @returns {Promise<void>} - Resolves when the fade-out transition completes and the popup content is cleared.
 *
 * Usage:
 * await hidePopup(popupEl, popupOverlayEl);
 */
export function hidePopup(popupEl, popupOverlayEl) {
    //prevent stacking hidePopup calls and killing good popups
    if (!popupEl || !popupEl.innerHTML) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        function onTransitionEnd(e) {
            if (e.target === popupOverlayEl && e.propertyName === "opacity") {
                popupOverlayEl.removeEventListener("transitionend", onTransitionEnd);

                //drop dom after fade out completes
                popupEl.innerHTML = "";
                resolve();
            }
        }

        popupOverlayEl.addEventListener("transitionend", onTransitionEnd);
        popupOverlayEl.classList.remove("active");
    });
}


/**
 * Shows a popup overlay by adding the "active" class, triggering
 * the CSS fade-in transition.
 *
 * @param {HTMLElement} popupOverlayEl - The overlay element to show.
 *
 * Usage:
 * showPopup(popupOverlayEl);
 */
export function showPopup(popupOverlayEl) {
    popupOverlayEl.offsetHeight; //reflow
    popupOverlayEl.classList.add("active");
}
