//static/js/features/search/controller.js

import { 
    search, 
    deepSearch, 
    downloadSearch,

    hideDropdown, 
    showDropdown,

    focusSearchInput,
    unfocusSearchInput,
    getTrimmedSearchInput,
    setClearInput
} from "./index.js";

import { 
    loadTrack, 
    playLoadedTrack,
    cleanupCurrentAudio,

    updatePlayPauseButtonDisplay,

    resetUI,
    updateMediaSession
} from "../audio/index.js";

import { 
    prefetchTrack,
    queuePushTrack,
    queuePushFrontTrack,
    queueSetAllTracks,
    queueSetFirstTrack,
    renderQueue,
    queueRemoveTrack,
    conditionalPrefetch
} from "../queue/index.js";

import { logDebug } from "../../utils/debug.js";

import { searchDomEls } from "../../dom/selectors.js";
import { showToast } from "../toast/index.js";

import { TrackStore } from "../../cache/TrackStore.js";
import { QueueStore } from "../../cache/QueueStore.js";

const { searchInputEl, deepSearchButtonEl, downloadSearchButtonEl, searchDropdownEl, searchListEl } = searchDomEls;





//typing in the search bar
export async function onSearchInput(e) {
    const q = e.target.value.trim();
    console.log("Search query:", q);
        
    const data = await search(q);
    console.log("data:", data);
}


//commit search
export async function onSearchEnter(e) {
	if (e.key !== "Enter") return;
	e.preventDefault(); //prevent default form animations if needed

    unfocusSearchInput();

    //deep search
    const q = e.target.value.trim();
	if (!q) return;
    logDebug("Deep search:", q);

    const data = await deepSearch(q);
    logDebug("data:", data);

    unfocusSearchInput();
    hideDropdown();
}


//button handling
async function onDeepSearchButtonClick() {
    //deep search
    const q = getTrimmedSearchInput(); //since we don't have e this is useful here
    if (!q) return;
    logDebug("Deep search:", q);

    //websocket handles populating?
    const data = await deepSearch(q);
    logDebug("data:", data);

    unfocusSearchInput();
    hideDropdown();
}

async function onDownloadSearchButtonClick() {
    const q = getTrimmedSearchInput();
    if (!q) return;
    logDebug("Download search:", q);

    //websocket handles populating?
    const data = await downloadSearch(q);
    logDebug("data:", data);

    unfocusSearchInput();
    hideDropdown();
}


/**
 * -------------------------------------------------------------------
 * Search Input & Dropdown Interaction Module
 * -------------------------------------------------------------------
 * 
 * This stuff manages the behavior of the search input, dropdown,
 * and associated buttons in a mobile-friendly search UI.
 * It handles focus, blur, clicks, dropdown interactions, and
 * prevents unwanted dropdown closing on iOS "Done" button presses.
 */

/**
 * Flag used to ignore the next input blur event.
 * This allows programmatic input blurs (e.g., from interacting with
 * the dropdown) without triggering dropdown hiding.
 * useful for iOS "Done" button behavior
 * Lowkey kind of a mess that clearInput flag is inside ui.js but it's to prevent injection at this controller level
 */
let ignoreNextBlur = false; //this is for allowing just input blur and not triggering cleanup when pressing "done" on iOS


/**
 * Programmatically blur the search input while keeping the dropdown open.
 * Sets ignoreNextBlur to prevent the blur handler from hiding the dropdown.
 */
export function blurInputButKeepDropdown() {
    ignoreNextBlur = true;
    unfocusSearchInput();
    setClearInput(false);
}

/**
 * Handler for the search input blur event.
 * Hides the dropdown and clears the input state unless the blur
 * was programmatically triggered (ignoreNextBlur is true).
 */
export function onSearchInputBlur() {
    if (ignoreNextBlur) {
        ignoreNextBlur = false;
        return;
    }
    hideDropdown();
    setClearInput(true);
}


/**
 * Handles search input gaining focus.
 * Focuses the input, shows the dropdown, and ensures
 * the "clear input" flag is off.
 */
export function onSearchFocus() {
    focusSearchInput();
    showDropdown();
    setClearInput(false);
}

/**
 * Handles losing focus from the search UI entirely.
 * Blurs the input, hides the dropdown, and sets the
 * "clear input" flag to true.
 */
export function onLoseSearchFocus() {
    unfocusSearchInput();
    hideDropdown();
    setClearInput(true);
}


/**
 * Handles all document-level click events related to the search UI.
 * Delegates behavior based on click location:
 *   - Clicking inside the search input: focuses input and shows dropdown
 *   - Clicking inside the dropdown: blurs input but keeps dropdown open
 *   - Clicking anywhere else: blurs input and hides dropdown.
 *   - Clicking the deep search or download buttons triggers their respective actions.
 * 
 * @param {MouseEvent | TouchEvent} e - The click or touch event object.
 */
export async function onDocumentSearchClick(e) {
    const isInSearchInput = searchInputEl.contains(e.target);
    const isInDeepSearchButton = deepSearchButtonEl.contains(e.target);
    const isInDownloadSearchButton = downloadSearchButtonEl.contains(e.target);
    const isInDropdown = searchListEl.contains(e.target);

    //(`Status: isInSearchInput: ${isInSearchInput}, isInDropdown: ${isInDropdown}`);
    //logDebug("searchDropdownEl:", searchDropdownEl);
    //logDebug("searchListEl:", searchListEl);

    if (isInSearchInput) {
        //handle search input focus
        const data = await search("");
        console.log("data:", data);

        onSearchFocus();
    } else if (isInDropdown) {
        //handle dropdown touch, scroll handled in separate touchmove
        await onClickSearchList(e);
        onLoseSearchFocus();
        hideDropdown();
    } else {
        //unfocus anywhere else
        onLoseSearchFocus();

        //button clicks
        if (isInDeepSearchButton) {
            await onDeepSearchButtonClick();
        } else if (isInDownloadSearchButton) {
            await onDownloadSearchButtonClick();
        }

    }

}

//clicking the queue list will check for this
export async function onClickSearchList(e) {
    //check what was clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    //handle button or whole row pressed
    if (button) {
        if (button.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(dataset);

        } else if (button.classList.contains("more-button")) {
            logDebug("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        logDebug("Play clicked");
        await onClickPlayButton(dataset);
    }
}

//helpers
async function onClickPlayButton(dataset) {
    const start = performance.now();

    //0. parse data
    const trackId = dataset.trackId;

    const isDownloaded = dataset.isDownloaded === "true"; //dataset are strings
    if (!isDownloaded) { //so why does this not trigger? i dont see the not downloaded debug message?
        showToast("Downloading...");
        try {
            await queuePushFrontTrack(trackId);
        } catch (err) {
            logDebug("Queue failed", err);
        }
        return;
    }

    //logDebug("[onClickPlayButton] dataset:", dataset);
    logDebug("[onClickPlayButton] track:", TrackStore.get(trackId));

    if (!trackId) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    //1. make changes to local queue
    QueueStore.setFirst(trackId);

    //2. attempt loading after cleanup
    try {
        await cleanupCurrentAudio();
        await loadTrack(trackId);
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to clean or load audio:", err);
    }

    //3. make optimistic ui changes
    const track = TrackStore.get(trackId);
    logDebug("TRACK LOAD COMPLETE, WAITING FOR TRACK:", track);

    updateMediaSession(track, true);
    renderQueue();
    resetUI();
    updatePlayPauseButtonDisplay(true);

    //4. send changes to server (returns websocket message to sync ui)
    try {
        await queueSetFirstTrack(trackId);
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to set first track in backend:", err);
    }

    try {
        //5. play audio
        await playLoadedTrack();
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to play audio:", err);
    }

    const end = performance.now();
    const elapsed = (end - start).toFixed(1);
    logDebug(`[onClickPlayButton] Total elapsed: ${elapsed} ms`);
}
