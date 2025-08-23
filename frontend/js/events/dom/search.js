import { searchDomEls } from "../../dom/index.js";

import { debounce } from "../../utils/index.js";

import { 
    onSearchEnter,
    onSearchInput,

    onDeepSearchButtonClick,
    onDownloadSearchButtonClick,
} from "../../features/search/controller.js";


export function setupSearchEventListeners() {
    searchDomEls.searchInputEl.addEventListener("input", debounce((e) => onSearchInput(e), 300));
    searchDomEls.searchInputEl.addEventListener("keydown", (e) => onSearchEnter(e));

    searchDomEls.deepSearchButtonEl.addEventListener("click", () => onDeepSearchButtonClick(searchDomEls));
    
    searchDomEls.downloadSearchButtonEl.addEventListener("click", () => onDownloadSearchButtonClick(searchDomEls));
}