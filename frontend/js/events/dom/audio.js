//static/js/events/dom/audio.js

import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onAudioEnded, 
    syncProgressBarWithAudio, 
    onNextButtonClick, 
    onPlayPauseButtonClick, 
    onPreviousButtonClick,
    scrubStartSeek,
    scrubPreviewSeekTime,
    scrubCommitSeek
} from "../../features/audio/controller.js";

export function setupAudioEventListeners() {
    const domEls = {
        audioEl: $(SELECTORS.audio.ids.PLAYER),
        ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),
        nextButtonEl: $(SELECTORS.audio.ids.NEXT_BUTTON),
        prevButtonEl: $(SELECTORS.audio.ids.PREVIOUS_BUTTON),
        durationEl: $(SELECTORS.audio.ids.DURATION),
        currTimeEl: $(SELECTORS.audio.ids.CURRENT_TIME),
        progBarEl: $(SELECTORS.audio.ids.PROGRESS_BAR)
    };

    //hook up event listeners
    //autoplay
    domEls.audioEl.addEventListener("ended", () => onAudioEnded(domEls));
    domEls.audioEl.addEventListener("timeupdate", () => syncProgressBarWithAudio(domEls));
    
    //user input
    domEls.nextButtonEl.addEventListener("click", () => onNextButtonClick(domEls));
    domEls.ppButtonEl.addEventListener("click", () => onPlayPauseButtonClick(domEls));
    domEls.prevButtonEl.addEventListener("click", () => onPreviousButtonClick(domEls));

    //scrubber logic
    domEls.progBarEl.addEventListener("pointerdown", () => scrubStartSeek());
    domEls.progBarEl.addEventListener("input", () => scrubPreviewSeekTime(domEls));
    domEls.progBarEl.addEventListener("pointerup", () => scrubCommitSeek(domEls));
}
