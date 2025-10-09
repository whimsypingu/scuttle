import { searchDomEls } from "../../dom/index.js";

import { debounce } from "../../utils/index.js";

import { 
    onSearchEnter,
    onSearchInput,

    onDocumentSearchClick,
    onSearchInputBlur,
    blurInputButKeepDropdown,
} from "../../features/search/controller.js";


export function setupSearchEventListeners() {
    searchDomEls.searchInputEl.addEventListener("input", debounce((e) => onSearchInput(e), 300));
    searchDomEls.searchInputEl.addEventListener("keydown", (e) => onSearchEnter(e));

    searchDomEls.searchInputEl.addEventListener("blur", () => onSearchInputBlur());

    document.addEventListener("click", (e) => onDocumentSearchClick(e)); //consolidated handling of all touching events

    searchDomEls.searchDropdownEl.addEventListener("touchmove", () => blurInputButKeepDropdown());
}