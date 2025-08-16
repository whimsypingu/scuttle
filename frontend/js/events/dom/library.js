import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onClickLibraryList 
} from "../../features/library/controller.js";

export function setupLibraryEventListeners() {
    const domEls = {
        audioEl: $(SELECTORS.audio.ids.PLAYER),
        titleEl: $(SELECTORS.audio.ids.TITLE),
        authorEl: $(SELECTORS.audio.ids.AUTHOR),

        currTimeEl: $(SELECTORS.audio.ids.CURRENT_TIME),
        progBarEl: $(SELECTORS.audio.ids.PROGRESS_BAR),
        durationEl: $(SELECTORS.audio.ids.DURATION),

        ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),

        nextButtonEl: $(SELECTORS.audio.ids.NEXT_BUTTON),
        prevButtonEl: $(SELECTORS.audio.ids.PREVIOUS_BUTTON),

        libraryList: $(SELECTORS.library.ids.LIST)
    };
        
    domEls.libraryList.addEventListener("click", (e) => onClickLibraryList(e, domEls));
}
