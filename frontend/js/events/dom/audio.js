//static/js/events/dom/audio.js

import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onAudioEnded, 
    onTimeUpdate,

    onNextButtonClick, 
    onPlayPauseButtonClick, 
    onPreviousButtonClick,
    
    startScrubSeek,
    inputScrubSeek,
    commitScrubSeek,
} from "../../features/audio/controller.js";

export function setupAudioEventListeners() {
    //const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;
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
    };

    //hook up event listeners
    //autoplay
    domEls.audioEl.addEventListener("ended", () => onAudioEnded(domEls));
    domEls.audioEl.addEventListener("timeupdate", () => onTimeUpdate(domEls));
    
    //user input
    domEls.nextButtonEl.addEventListener("click", () => onNextButtonClick(domEls));
    domEls.ppButtonEl.addEventListener("click", () => onPlayPauseButtonClick(domEls));
    domEls.prevButtonEl.addEventListener("click", () => onPreviousButtonClick(domEls));

    //scrubber logic
    domEls.progBarEl.addEventListener("pointerdown", () => startScrubSeek(domEls));
    domEls.progBarEl.addEventListener("input", () => inputScrubSeek(domEls));
    window.addEventListener("pointerup", () => commitScrubSeek(domEls));
}
