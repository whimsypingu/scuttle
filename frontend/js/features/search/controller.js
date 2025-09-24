//static/js/features/search/controller.js

import { 
    search, 
    deepSearch, 
    downloadSearch,

    hideDropdown, 
    showDropdown 
} from "./index.js";

import { logDebug } from "../../utils/debug.js";

import { searchDomEls } from "../../dom/selectors.js";


//typing in the search bar
export async function onSearchInput(e) {
    const { searchDropdownEl } = searchDomEls;

    const q = e.target.value.trim();
    console.log("Search query:", q);
    
    if (q === "") {
        hideDropdown(searchDropdownEl);
        return;
    } else {

        console.log("DROPDOWN ACTIVE");
        showDropdown(searchDropdownEl);
    }
    
    const data = await search(q);
    console.log("data:", data);
}


//commit search
export async function onSearchEnter(e) {
	if (e.key !== "Enter") return;
	e.preventDefault(); //prevent form submit just in case

    const q = e.target.value.trim();
    logDebug("Deep search:", q);

	if (!q) return;

    const data = await deepSearch(q);
    logDebug("data:", data);
}

export async function onDeepSearchButtonClick(domEls) {
    const { searchInputEl } = domEls;

    const q = searchInputEl.value.trim();
    logDebug("Deep search:", q);

    if (!q) return;
    
    const data = await deepSearch(q);
    logDebug("data:", data);
}



//download search
export async function onDownloadSearchButtonClick(domEls) {
    const { searchInputEl } = domEls;

    const q = searchInputEl.value.trim();
    logDebug("Download search:", q);

    if (!q) return;

    const data = await downloadSearch(q);
    logDebug("data:", data);
}