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

import { logDebug } from "../../utils/debug.js";

import { searchDomEls } from "../../dom/selectors.js";
const { searchInputEl, deepSearchButtonEl, downloadSearchButtonEl, searchDropdownEl } = searchDomEls;





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
}

async function onDownloadSearchButtonClick() {
    const q = getTrimmedSearchInput();
    if (!q) return;
    logDebug("Download search:", q);

    //websocket handles populating?
    const data = await downloadSearch(q);
    logDebug("data:", data);
}



let ignoreNextBlur = false; //this is for allowing just input blur and not triggering cleanup when pressing "done" on iOS

export function blurInputButKeepDropdown() {
    ignoreNextBlur = true;
    unfocusSearchInput();
    setClearInput(false);
}
export function onSearchInputBlur() {
    if (ignoreNextBlur) {
        ignoreNextBlur = false;
        return;
    }
    hideDropdown();
    setClearInput(true);
}

export function onSearchFocus() {
    focusSearchInput();
    showDropdown();
    setClearInput(false);
}

export function onLoseSearchFocus() {
    unfocusSearchInput();
    hideDropdown();
    setClearInput(true);
}

export async function onDocumentSearchClick(e) {
    const isInSearchInput = searchInputEl.contains(e.target);
    const isInDeepSearchButton = deepSearchButtonEl.contains(e.target);
    const isInDownloadSearchButton = downloadSearchButtonEl.contains(e.target);
    const isInDropdown = searchDropdownEl.contains(e.target);

    if (isInSearchInput) {
        //handle search input focus
        onSearchFocus();
    } else if (isInDropdown) {
        //handle dropdown touch, scroll handled in separate touchmove
        blurInputButKeepDropdown();
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