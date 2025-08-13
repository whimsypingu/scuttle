import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onClickQueueList 
} from "../../features/queue/controller.js";


export function setupQueueEventListeners() {
    const domEls = {
        audioEl: $(SELECTORS.audio.ids.PLAYER),
        ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),
        durationEl: $(SELECTORS.audio.ids.DURATION),
        queueList: $(SELECTORS.queue.ids.LIST)
    };

    domEls.queueList.addEventListener("click", (e) => onClickQueueList(e, domEls));
}