//static/js/events/dom/audio.js

import { domEls } from "../../dom/index.js";

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
    //hook up event listeners
    //autoplay
    domEls.audioEl.addEventListener("trackEnded", () => onAudioEnded()); //custom event
    domEls.audioEl.addEventListener("timeupdate", () => onTimeUpdate());
    
    //user input
    domEls.nextButtonEl.addEventListener("click", () => onNextButtonClick());
    domEls.ppButtonEl.addEventListener("click", () => onPlayPauseButtonClick());
    domEls.prevButtonEl.addEventListener("click", () => onPreviousButtonClick());

    //scrubber logic
    domEls.progBarEl.addEventListener("pointerdown", () => startScrubSeek());
    domEls.progBarEl.addEventListener("input", () => inputScrubSeek());
    window.addEventListener("pointerup", () => commitScrubSeek());
}
