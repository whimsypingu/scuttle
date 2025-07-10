// static/js/setup.js

import { SELECTORS, $ } from "./dom/index.js";
import { debounce } from "./utils/index.js";
import { onSearchInput, onSearchEnter, onClickLibraryList, onClickQueueList } from "./events/index.js";

//sets up all events
export function setupEventListeners() {

    //typing triggers dropdown
    $(SELECTORS.search.ids.INPUT).addEventListener("input", debounce(onSearchInput, 300));

    //enter triggers full search
    $(SELECTORS.search.ids.INPUT).addEventListener("keydown", onSearchEnter);

    //button click delegation on the library body
    $(SELECTORS.library.ids.LIST).addEventListener("click", onClickLibraryList);

    //button click delegation on the queue body
    $(SELECTORS.queue.ids.LIST).addEventListener("click", onClickQueueList);
}
