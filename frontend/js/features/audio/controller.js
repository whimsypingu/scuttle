//static/js/features/audio/controller.js

import { 
    queuePopTrack 
} from "../queue/index.js";

import { 
    loadTrack,
    playLoadedTrack,
    pauseLoadedTrack,
    trackState,
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

import { QueueStore } from "../../cache/QueueStore.js";
import { getPlayerEl } from "./lib/streamTrick.js";


//autoplay
export async function onAudioEnded(domEls) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;

    try {
        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local , which will trigger queue ui update
        QueueStore.pop();
        const track = QueueStore.peekTrack();
        logDebug("Next track:", track);

        //2. clean
        await cleanupCurrentAudio(audioEl);

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI(null, currTimeEl, progBarEl, durationEl);
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            return;
        }

        //4. load new track
        await loadTrack(audioEl, track.id);
        const playerEl = getPlayerEl();

        //5. make optimistic ui changes
        updateMediaSession(track, true);
        redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
        resetUI(playerEl, currTimeEl, progBarEl, durationEl);
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

    console.error(trackState());

    try {
        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local, which will trigger queue ui update
        //logDebug("CURRENT STATE:", QueueStore.getTracks());
        QueueStore.pop();
        //logDebug("CURRENT STATE POST POP:", QueueStore.getTracks());
        const track = QueueStore.peekTrack();
        logDebug("Next track:", track);

        //2. clean
        await cleanupCurrentAudio(audioEl);

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI(null, currTimeEl, progBarEl, durationEl);
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            return;
        }

        //4. load new track
        await loadTrack(audioEl, track.id);
        const playerEl = getPlayerEl();

        //5. make optimistic ui changes
        redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
        resetUI(playerEl, currTimeEl, progBarEl, durationEl);
        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //6. play audio
        await playLoadedTrack(audioEl);
        updateMediaSession(track, true);

        //7. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();
    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
}

//play or pause
export async function onPlayPauseButtonClick(domEls) {
    const { audioEl, ppButtonEl } = domEls;

    console.error(trackState());

    //1. check for track
    const track = QueueStore.peekTrack();
    if (!track) return;

    //2. handle click
    if (trackState()) {
        try {
            await playLoadedTrack(audioEl);            
            updatePlayPauseButtonDisplay(ppButtonEl, true);
        } catch {
            updatePlayPauseButtonDisplay(ppButtonEl, false);
            logDebug("Play failed");
        }
    } else {
        pauseLoadedTrack();
        updatePlayPauseButtonDisplay(ppButtonEl, false);
    }
}

//previous --gonna become a mess when previous track is allowed
export function onPreviousButtonClick(domEls) {
    const { audioEl, currTimeEl, progBarEl } = domEls;

    const playerEl = getPlayerEl();

    playerEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, playerEl);
    syncProgressBar(progBarEl, playerEl);
}


//scrubber logic and events
let isSeeking = false;

//time update
export function onTimeUpdate(domEls) {
    if (!isSeeking) {
        const { audioEl, currTimeEl, progBarEl } = domEls;

        const playerEl = getPlayerEl();

        syncCurrentTimeDisplay(currTimeEl, playerEl);
        syncProgressBar(progBarEl, playerEl);
    }
}

//start scrub seek, pointer down on progress bar
export function startScrubSeek(domEls) {
    const { audioEl } = domEls;

    const playerEl = getPlayerEl();

    if (!playerEl.src || playerEl.readyState === 0) return; // nothing loaded, abort
    isSeeking = true;
}

//preview scrub seek, swipe on progress bar
export function inputScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, currTimeEl, progBarEl } = domEls;

    const playerEl = getPlayerEl();

    const seekTime = (progBarEl.value / 100) * playerEl.duration;
    setCurrentTimeDisplay(currTimeEl, seekTime);
    setProgressBar(progBarEl, progBarEl.value); //set to value shown
}

//commit scrub seek, pointer up on window
export function commitScrubSeek(domEls) {
    if (!isSeeking) return;
    
    const { audioEl, currTimeEl, progBarEl } = domEls;

    const playerEl = getPlayerEl();

    const seekTime = (progBarEl.value / 100) * playerEl.duration;
    playerEl.currentTime = seekTime; //set and sync
    syncCurrentTimeDisplay(currTimeEl, playerEl);
    syncProgressBar(progBarEl, playerEl);

    isSeeking = false;
}

