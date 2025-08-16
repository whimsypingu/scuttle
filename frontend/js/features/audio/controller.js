//static/js/features/audio/controller.js

import { 
    queuePopTrack 
} from "../queue/index.js";

import { 
    cleanupCurrentAudio,
    loadTrack,
    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    updatePlayPauseButtonDisplay, 
    setProgressBar,
    syncProgressBar, 
    playLoadedTrack,
    renderNowPlaying,
    syncDurationDisplay
} from "./index.js";

import { logDebug } from "../../utils/debug.js";
import { peekLocalQueue, popLocalQueue } from "../../cache/localqueue.js";



//autoplay
export async function onAudioEnded(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    try {
        //1. make changes to local queue
        popLocalQueue();
        const track = peekLocalQueue();

        //2. load in the blob
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);

        logDebug("metadata_loaded"); //debug

        //3. make optimistic ui changes
        renderNowPlaying(titleEl, authorEl, track);

        audioEl.currentTime = 0;
        syncCurrentTimeDisplay(currTimeEl, audioEl);
        syncProgressBar(progBarEl, audioEl);
        syncDurationDisplay(durationEl, audioEl);

        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //4. play audio
        await playLoadedTrack(audioEl);

        //5. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();

    } catch (err) {
        logDebug("Failure");
        console.error("Failed to play audio:", err);
    }
}

//next
export async function onNextButtonClick(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    console.error(audioEl.paused);

    try {
        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local queue
        popLocalQueue();
        const track = peekLocalQueue();

        logDebug("local_track:", track);

        //2. load in blob
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);
        
        logDebug("loaded_metadata"); //debug

        //3. make optimistic ui changes
        renderNowPlaying(titleEl, authorEl, track);

        audioEl.currentTime = 0;
        syncCurrentTimeDisplay(currTimeEl, audioEl);
        syncProgressBar(progBarEl, audioEl);
        syncDurationDisplay(durationEl, audioEl);

        updatePlayPauseButtonDisplay(ppButtonEl, true);

        //4. play audio
        await playLoadedTrack(audioEl);

        //5. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();

    } catch (err) {
        logDebug("Failure");
        console.error("Failed to play audio:", err);
    }
}

//play or pause
export async function onPlayPauseButtonClick(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    console.error(audioEl.paused);

    //edge case where item is in queue but not yet loaded into audio element.    
    if (!audioEl.src || audioEl.readyState === 0) {
        console.warn("No audio source set, attempting blob load");

        const track = peekLocalQueue();
        await loadTrack(audioEl, track);
    }

    //click handler
    if (audioEl.paused) {
        try {
            await playLoadedTrack(audioEl);            
            updatePlayPauseButtonDisplay(ppButtonEl, true);
        } catch {
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            logDebug("play_failed");
        }
    } else {
        audioEl.pause();
        updatePlayPauseButtonDisplay(ppButtonEl, false);
    }
}

//previous
export function onPreviousButtonClick(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    audioEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncProgressBar(progBarEl, audioEl);
}


//scrubber logic and events
let isSeeking = false;

//time update
export function onTimeUpdate(domEls) {
    if (!isSeeking) {
        const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

        syncCurrentTimeDisplay(currTimeEl, audioEl);
        syncProgressBar(progBarEl, audioEl);
    }
}

//start scrub seek, pointer down on progress bar
export function startScrubSeek(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    if (!audioEl.src || audioEl.readyState === 0) return; // nothing loaded, abort
    isSeeking = true;
}

//preview scrub seek, swipe on progress bar
export function inputScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    setCurrentTimeDisplay(currTimeEl, seekTime);
    setProgressBar(progBarEl, progBarEl.value); //set to value shown
}

//commit scrub seek, pointer up on window
export function commitScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    const seekTime = (progBarEl.value / 100) * audioEl.duration;
    audioEl.currentTime = seekTime; //set and sync
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncProgressBar(progBarEl, audioEl);

    isSeeking = false;
}

