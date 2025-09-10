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
    domEls.audioEl.addEventListener("trackEnded", () => onAudioEnded(domEls)); //custom event
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
