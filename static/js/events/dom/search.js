import { SELECTORS, $ } from "../../dom/index.js";

import { debounce } from "../../utils/index.js";

import { 
    onSearchEnter,
    onSearchInput
} from "../../features/search/controller.js";



const domEls = {
    searchInput: $(SELECTORS.search.ids.INPUT)
};

export function setupSearchEventListeners() {
    domEls.searchInput.addEventListener("input", debounce((e) => onSearchInput(e), 300));
    domEls.searchInput.addEventListener("keydown", (e) => onSearchEnter(e));
}