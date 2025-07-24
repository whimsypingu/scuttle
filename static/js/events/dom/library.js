import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onClickLibraryList 
} from "../../features/library/controller.js";

export function setupLibraryEventListeners() {
    const domEls = {
        libraryList: $(SELECTORS.library.ids.LIST)
    };

    domEls.libraryList.addEventListener("click", (e) => onClickLibraryList(e, domEls));
}
