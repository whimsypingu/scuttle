//static/js/features/audio/controller.js

import { 
    queuePopTrack 
} from "../queue/index.js";

import { 
    playCurrentTrack,
    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    updatePlayPauseButtonDisplay, 
    syncProgressBar 
} from "./index.js";


//scrubber logic and events
let isSeeking = false;

//autoplay
export async function onAudioEnded(domEls) {
    const audioEl = domEls.audioEl;
    const durationEl = domEls.durationEl;
    const ppButtonEl = domEls.ppButtonEl;
    const currTimeEl = domEls.currTimeEl;
    const progBarEl = domEls.progBarEl;

    try {
        await queuePopTrack();
        await playCurrentTrack(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl);
    } catch (err) {
        console.error("Failed to play audio:", err);
    }
}

//next
export async function onNextButtonClick(domEls) {
    const audioEl = domEls.audioEl;
    const durationEl = domEls.durationEl;
    const ppButtonEl = domEls.ppButtonEl;
    const currTimeEl = domEls.currTimeEl;
    const progBarEl = domEls.progBarEl;

    console.error(audioEl.paused);

    try {
        await queuePopTrack();
        await playCurrentTrack(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl);
    } catch (err) {
        console.error("Failed to play audio:", err);
    }
}

//play or pause
export async function onPlayPauseButtonClick(domEls) {
    const audioEl = domEls.audioEl;
    const durationEl = domEls.durationEl;
    const ppButtonEl = domEls.ppButtonEl;
    const currTimeEl = domEls.currTimeEl;
    const progBarEl = domEls.progBarEl;

    console.error(audioEl.paused);


    //edge case where item is in queue but not yet loaded into audio element.    
    if (!audioEl.src || audioEl.readyState === 0) {
        console.warn("No audio source set, attempting blob load");
        await playCurrentTrack(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl);
        return;
    }

    if (audioEl.paused) {
        audioEl.play().then(() => {
            updatePlayPauseButtonDisplay(ppButtonEl, true);
        }).catch(err => {
            console.error("Failed to play audio:", err);
        });
    } else {
        audioEl.pause()
        updatePlayPauseButtonDisplay(ppButtonEl, false);
    }
}

//previous
export function onPreviousButtonClick(domEls) {
    const audioEl = domEls.audioEl;
    const currTimeEl = domEls.currTimeEl;

    audioEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, audioEl);
}

//scrubbing
export function scrubStartSeek() {
    isSeeking = true;
}

export function scrubPreviewSeekTime(domEls) {
    const audioEl = domEls.audioEl;
    const progBarEl = domEls.progBarEl;
    const currTimeEl = domEls.currTimeEl;

    if (!audioEl?.duration || isNaN(audioEl.duration)) return; //check

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    setCurrentTimeDisplay(currTimeEl, seekTime);
}

export function scrubCommitSeek(domEls) {
    const audioEl = domEls.audioEl;
    const progBarEl = domEls.progBarEl;
    const currTimeEl = domEls.currTimeEl;

    if (!audioEl?.duration || isNaN(audioEl.duration)) return; //check

    isSeeking = false;

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    audioEl.currentTime = seekTime; //set and sync
    syncCurrentTimeDisplay(currTimeEl, audioEl);
}

//also autoplay
export function syncProgressBarWithAudio(domEls) {
    const audioEl = domEls.audioEl;
    const progBarEl = domEls.progBarEl;
    const currTimeEl = domEls.currTimeEl;

    if (isSeeking) return; //does not update when user is manually scrubbing

    syncProgressBar(progBarEl, audioEl);
    syncCurrentTimeDisplay(currTimeEl, audioEl);
}

