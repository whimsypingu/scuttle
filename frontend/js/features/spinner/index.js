import { $, SELECTORS } from "../../dom/index.js";
import { logDebug } from "../../utils/debug.js";

let loadingCounter = 0;
const spinnerEl = $(SELECTORS.spinner.ids.SPINNER);

// increment counter 
export function showSpinner() {
    loadingCounter++;

    logDebug("SPINNER INCREMENTED:", loadingCounter);

    updateSpinnerVisibility();
}

// decrement counter
export function hideSpinner() {
    loadingCounter = Math.max(0, loadingCounter - 1);

    logDebug("SPINNER DECREMENTED:", loadingCounter);

    updateSpinnerVisibility();
}



function updateSpinnerVisibility() {
    if (loadingCounter > 0) {
        spinnerEl.style.display = "block";
    } else {
        spinnerEl.style.display = "none";
    }
}