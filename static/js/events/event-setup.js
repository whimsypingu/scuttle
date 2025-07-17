// static/js/events/event-setup.js

import { SELECTORS, $ } from "../dom/index.js";
import { debounce } from "../utils/index.js";

import { onSearchInput, onSearchEnter } from "./rest/search-events.js";
import { onClickLibraryList } from "./rest/library-events.js";
import { onClickQueueList } from "./rest/queue-events.js";
import { onAudioEnded, onPreviousButtonClick, onPlayPauseButtonClick, onNextButtonClick, updateAudioProgress, onProgressBarPointerdown, onProgressBarPointerup, onProgressBarInput } from "./rest/audio-events.js";

import { handleWebSocketMessage } from "./websocket/websocket-events.js";
import { initWebSocket } from "../api/index.js";


//sets up all dom events
export function setupDomEventListeners() {

    //search
    $(SELECTORS.search.ids.INPUT).addEventListener("input", debounce(onSearchInput, 300));
    $(SELECTORS.search.ids.INPUT).addEventListener("keydown", onSearchEnter);

    //library
    $(SELECTORS.library.ids.LIST).addEventListener("click", onClickLibraryList);

    //queue
    $(SELECTORS.queue.ids.LIST).addEventListener("click", onClickQueueList);

    //audio
    $(SELECTORS.audio.ids.PLAYER).addEventListener("ended", onAudioEnded);

    $(SELECTORS.audio.ids.PREVIOUS_BUTTON).addEventListener("click", onPreviousButtonClick);
    $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON).addEventListener("click", onPlayPauseButtonClick);
    $(SELECTORS.audio.ids.NEXT_BUTTON).addEventListener("click", onNextButtonClick);

    $(SELECTORS.audio.ids.PLAYER).addEventListener("timeupdate", updateAudioProgress);
    $(SELECTORS.audio.ids.PROGRESS_BAR).addEventListener("pointerdown", onProgressBarPointerdown);
    $(SELECTORS.audio.ids.PROGRESS_BAR).addEventListener("pointerup", onProgressBarPointerup);
    $(SELECTORS.audio.ids.PROGRESS_BAR).addEventListener("input", onProgressBarInput);
}


//sets up a websocket
export function setupWebSocket() {
    const socket = initWebSocket();
    socket.onmessage = (messageEvent) => {
        try {
            const message = JSON.parse(messageEvent.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
        }
    };

}

