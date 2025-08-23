import { domEls } from "../../dom/index.js";

import { 
    onClickLibraryList 
} from "../../features/library/controller.js";

export function setupLibraryEventListeners() {
    domEls.libraryListEl.addEventListener("click", (e) => onClickLibraryList(e, domEls));
}
