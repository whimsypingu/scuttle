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
    
    setAudioTime,

    updateMediaSession,
    resetUI,

    isLoopNone,
    isLoopAll,
    isLoopOne
} from "./index.js";

import { renderQueue } from "../queue/index.js";

import { logDebug } from "../../utils/debug.js";

import { QueueStore } from "../../cache/QueueStore.js";
import { getPlayerEl, setIosPlaybackInterrupt } from "./lib/streamTrick.js";


//autoplay
export async function onAudioEnded() {
    try {
        //if looping one song on repeat, just restart current track
        if (isLoopOne()) {
            setAudioTime(0);
            await playLoadedTrack();
            return;
        }


        //instantaneously update everything, and then send the update to the backend
        //1. make changes to local , which will trigger queue ui update
        const poppedTrackId = QueueStore.pop();
        logDebug("POPPED TRACK:", poppedTrackId);
        if (isLoopAll()) {
            QueueStore.push(poppedTrackId);
            renderQueue();
            await queuePushTrack(poppedTrackId); //backend
        }

        const track = QueueStore.peekTrack();
        logDebug("Next track:", track);

        //2. clean
        await cleanupCurrentAudio();

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI();
            updatePlayPauseButtonDisplay(false);
            return;
        }

        //4. load new track
        await loadTrack(track.id);

        //5. make optimistic ui changes
        updateMediaSession(track, true);
        renderQueue();
        resetUI();
        updatePlayPauseButtonDisplay(true);
        
        //6. play audio
        await playLoadedTrack();

        //7. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();
    } catch (err) {
        logDebug("[onAudioEnded] Failed to play audio:", err);
    }
}

//next
export async function onNextButtonClick() {
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
        await cleanupCurrentAudio();

        //3. handle empty track
        if (!track) {
            logDebug("No track found in queue");
            resetUI();
            updatePlayPauseButtonDisplay(false);
            return;
        }

        //4. load new track
        await loadTrack(track.id);

        //5. make optimistic ui changes
        renderQueue();
        resetUI();
        updatePlayPauseButtonDisplay(true);
        
        //6. play audio
        await playLoadedTrack();
        updateMediaSession(track, true);

        //7. send changes to server (returns websocket message to sync ui)
        await queuePopTrack();
    } catch (err) {
        logDebug("[onNextButtonClick] Failed to play audio:", err);
    }
}

//play or pause
export async function onPlayPauseButtonClick() {
    console.error(trackState());

    //1. check for track
    const track = QueueStore.peekTrack();
    if (!track) return;

    //2. handle click
    if (trackState()) {
        try {
            await loadTrack(track.id);
            await playLoadedTrack();            
            updatePlayPauseButtonDisplay(true);
        } catch {
            updatePlayPauseButtonDisplay(false);
            logDebug("Play failed");
        }
    } else {
        pauseLoadedTrack();
        updatePlayPauseButtonDisplay(false);
    }
}

//previous --gonna become a mess when previous track is allowed
export function onPreviousButtonClick() {
    setAudioTime(0);
    return;
}



//suspended
export async function onRefocus() {
    logDebug("[onRefocus] TrackState:", trackState());
    if (trackState()) {
        
        renderQueue();
        updatePlayPauseButtonDisplay(false);
    }
}

//backgrounded
export async function onBackgrounded() {
    logDebug("[onBackgrounded] TrackState:", trackState());
    setIosPlaybackInterrupt(); //for iOS set recovery position to rebuild audioContext
}



//scrubber logic and events
let isSeeking = false;

//time update
export function onTimeUpdate() {
    if (trackState()) return; //paused

    if (!isSeeking) {
        syncCurrentTimeDisplay();
        syncProgressBar();
    }
}

//start scrub seek, pointer down on progress bar
export function startScrubSeek() {
    const playerEl = getPlayerEl();

    if (!playerEl.src || playerEl.readyState === 0) return; // nothing loaded, abort
    isSeeking = true;
}

//preview scrub seek, swipe on progress bar
import { domEls } from "../../dom/selectors.js";
const { progBarEl } = domEls;

export function inputScrubSeek() {
    if (!isSeeking) return;

    const playerEl = getPlayerEl();

    const seekTime = (progBarEl.value / 100) * playerEl.duration;
    setCurrentTimeDisplay(seekTime);
    setProgressBar(progBarEl.value); //set to value shown
}

//commit scrub seek, pointer up on window
export function commitScrubSeek() {
    if (!isSeeking) return;
    
    const playerEl = getPlayerEl();

    const seekTime = (progBarEl.value / 100) * playerEl.duration;

    setAudioTime(seekTime);

    isSeeking = false;
}

