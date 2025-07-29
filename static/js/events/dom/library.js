import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onClickLibraryList 
} from "../../features/library/controller.js";

export function setupLibraryEventListeners() {
    const domEls = {
        audioEl: $(SELECTORS.audio.ids.PLAYER),
        ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),
        durationEl: $(SELECTORS.audio.ids.DURATION),
        libraryList: $(SELECTORS.library.ids.LIST)
    };

    domEls.libraryList.addEventListener("click", (e) => onClickLibraryList(e, domEls));
}
