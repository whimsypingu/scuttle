export function hidePopup(popupEl, popupOverlayEl) {
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
    
    //popupOverlayEl.classList.remove("active");
}

export function showPopup(popupOverlayEl) {
    popupOverlayEl.classList.add("active");
}
