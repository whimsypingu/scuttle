//static/js/features/audio/controller.js

import { 
    prefetchNextTrack,
    queuePopTrack,
    queuePushTrack
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
    isLoopOne,
    toggleLoopMode,

    spinLoopButton,
    setLoopButton
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
    } catch (err) {
        logDebug("[onAudioEnded] Loop one failed:", err);
    }

    //instantaneously update everything, and then send the update to the backend
    //1. make changes to local, which will trigger queue ui update
    const poppedTrackId = QueueStore.pop();
    logDebug("POPPED TRACK:", poppedTrackId);
    
    if (isLoopAll()) {
        QueueStore.push(poppedTrackId);
    }

    const track = QueueStore.peekTrack();
    logDebug("Next track:", track);

    //2. handle empty track
    if (!track) {
        logDebug("No track found in queue");
        setAudioTime(0);
        resetUI();
        updatePlayPauseButtonDisplay(false);
        return;
    }

    //3. clean
    try {
    } catch (err) {
        logDebug("[onAudioEnded] cleanup failed:", err);
    }

    //4. load new track
    try {
        await loadTrack(track.id);
    } catch (err) {
        logDebug("[onAudioEnded] loadTrack failed:", err);
        resetUI();
        updatePlayPauseButtonDisplay(false);
        return;
    }

    //5. make optimistic ui changes
    updateMediaSession(track, true);
    renderQueue();
    resetUI();
    updatePlayPauseButtonDisplay(true);
        
    //6. play audio
    try {
        await playLoadedTrack();
    } catch (err) {
        logDebug("[onAudioEnded] Failed to playLoadedTrack:", err);
    }

    //7. send changes to server (returns websocket message to sync ui)
    try {
        if (isLoopAll()) {
            await queuePushTrack(poppedTrackId); //backend
        }
        await queuePopTrack();
    } catch (err) {
        logDebug("[onAudioEnded] Failed to update backend queue:", err);
    }

    //8. prefetch next track
    try {
        const nextTrack = QueueStore.peekId(1);
        if (nextTrack) {
            await prefetchNextTrack(nextTrack);
        }
    } catch (err) {
        logDebug("[onAudioEnded] Failed to prefetch next track:", err);
    }
}

//next
export async function onNextButtonClick() {
    console.error(trackState());

    //instantaneously update everything, and then send the update to the backend
    //1. make changes to local, which will trigger queue ui update
    //logDebug("CURRENT STATE:", QueueStore.getTracks());
    QueueStore.pop();
    //logDebug("CURRENT STATE POST POP:", QueueStore.getTracks());
    const track = QueueStore.peekTrack();
    logDebug("Next track:", track);

    //2. handle empty track
    if (!track) {
        logDebug("No track found in queue");
        setAudioTime(0);
        resetUI();
        updatePlayPauseButtonDisplay(false);
        return;
    }

    //3. clean
    try {
        await cleanupCurrentAudio();
    } catch (err) {
        logDebug("[onNextButtonClick] cleanup failed:", err);
    }

    //4. load new track
    try {
        await loadTrack(track.id);
    } catch (err) {
        logDebug("[onNextButtonClick] loadTrack failed:", err);
        resetUI();
        updatePlayPauseButtonDisplay(false);
    }

    //5. make optimistic ui changes
    updateMediaSession(track, true);
    renderQueue();
    resetUI();
    updatePlayPauseButtonDisplay(true);
        
    //6. play audio
    try {
        await playLoadedTrack();
    } catch (err) {
        logDebug("[onNextButtonClick] Failed to playLoadedTrack:", err);
    }

    //7. send changes to server (returns websocket message to sync ui)
    try {
        await queuePopTrack();
    } catch (err) {
        logDebug("[onNextButtonClick] Failed to update backend queue:", err);
    }

    //8. prefetch next track
    try {
        const nextTrack = QueueStore.peekId(1);
        if (nextTrack) {
            await prefetchNextTrack(nextTrack);
        }
    } catch (err) {
        logDebug("[onNextButtonClick] Failed to prefetch next track:", err);
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
        } catch (err) {
            updatePlayPauseButtonDisplay(false);
            logDebug("Play failed:", err);
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



//looping
export function onLoopButtonClick() {
    const { looping, one} = toggleLoopMode();

    spinLoopButton();

    setLoopButton(looping, one);
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



