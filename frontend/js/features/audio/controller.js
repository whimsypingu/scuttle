//static/js/features/audio/controller.js

import { 
    queuePopTrack 
} from "../queue/index.js";

import { 
    loadTrack,
    playLoadedTrack,
    cleanupCurrentAudio,

    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    updatePlayPauseButtonDisplay, 
    setProgressBar,
    syncProgressBar, 

    updateMediaSession,
    resetUI
} from "./index.js";

import { redrawQueueUI } from "../queue/index.js";

import { logDebug } from "../../utils/debug.js";
import { getLocalQueue, peekLocalQueue, popLocalQueue } from "../../cache/localqueue.js";



//autoplay
export async function onAudioEnded(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;

    try {
        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local , which will trigger queue ui update
        popLocalQueue();
        const track = peekLocalQueue();
        logDebug("Next track:", track);

        //2. clean
        await cleanupCurrentAudio(audioEl);

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI(audioEl, currTimeEl, progBarEl, durationEl);
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            return;
        }

        //4. load new track
        await loadTrack(audioEl, track);

        //5. make optimistic ui changes
        updateMediaSession(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, getLocalQueue());
        resetUI(audioEl, currTimeEl, progBarEl, durationEl);
        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //6. play audio
        await playLoadedTrack(audioEl);

        //7. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();
    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
}

//next
export async function onNextButtonClick(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;

    console.error(audioEl.paused);

    try {
        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local, which will trigger queue ui update
        popLocalQueue();
        const track = peekLocalQueue();
        logDebug("Next track:", track);

        //2. clean
        await cleanupCurrentAudio(audioEl);

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI(audioEl, currTimeEl, progBarEl, durationEl);
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            return;
        }

        //4. load new track
        await loadTrack(audioEl, track);

        //5. make optimistic ui changes
        updateMediaSession(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, getLocalQueue());
        resetUI(audioEl, currTimeEl, progBarEl, durationEl);
        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //6. play audio
        await playLoadedTrack(audioEl);

        //7. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();
    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
}

//play or pause
export async function onPlayPauseButtonClick(domEls) {
    const { audioEl, ppButtonEl } = domEls;

    console.error(audioEl.paused);

    //1. check for track
    const track = peekLocalQueue();
    if (!track) return;

    //2. load in edge case where item is in queue but not yet loaded into audio element.    
    if (!audioEl.src || audioEl.readyState === 0) {
        logDebug("No audio source set somehow, attempting load");
        await loadTrack(audioEl, track);
    }

    //3. handle click
    if (audioEl.paused) {
        try {
            await playLoadedTrack(audioEl);            
            updatePlayPauseButtonDisplay(ppButtonEl, true);
        } catch {
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            logDebug("Play failed");
        }
    } else {
        audioEl.pause();
        updatePlayPauseButtonDisplay(ppButtonEl, false);
    }
}

//previous --gonna become a mess when previous track is allowed
export function onPreviousButtonClick(domEls) {
    const { audioEl, currTimeEl, progBarEl } = domEls;

    audioEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncProgressBar(progBarEl, audioEl);
}


//scrubber logic and events
let isSeeking = false;

//time update
export function onTimeUpdate(domEls) {
    if (!isSeeking) {
        const { audioEl, currTimeEl, progBarEl } = domEls;

        syncCurrentTimeDisplay(currTimeEl, audioEl);
        syncProgressBar(progBarEl, audioEl);
    }
}

//start scrub seek, pointer down on progress bar
export function startScrubSeek(domEls) {
    const { audioEl } = domEls;

    if (!audioEl.src || audioEl.readyState === 0) return; // nothing loaded, abort
    isSeeking = true;
}

//preview scrub seek, swipe on progress bar
export function inputScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, currTimeEl, progBarEl } = domEls;

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    setCurrentTimeDisplay(currTimeEl, seekTime);
    setProgressBar(progBarEl, progBarEl.value); //set to value shown
}

//commit scrub seek, pointer up on window
export function commitScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, currTimeEl, progBarEl } = domEls;

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    audioEl.currentTime = seekTime; //set and sync
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncProgressBar(progBarEl, audioEl);

    isSeeking = false;
}

