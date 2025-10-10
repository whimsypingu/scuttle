//static/js/features/queue/controller.js

import { logDebug } from "../../utils/debug.js";

import { 
    loadTrack, 
    playLoadedTrack,
    cleanupCurrentAudio,

    updatePlayPauseButtonDisplay,

    resetUI,
    updateMediaSession,
    getAudioStream
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack,
    queueClear,

    renderQueue,
} from "./index.js";

import { QueueStore } from "../../cache/QueueStore.js";

import { fisherYatesShuffle } from "../playlist/index.js";
import { showAreYouSurePopup } from "../popup/controller.js";



export async function onClickClearQueue() {
    if (QueueStore.length() <= 1) return; //dont bother with popup when queue is already blank

    const confirmed = await showAreYouSurePopup();

    if (confirmed) {
        //1. make changes to local queue
        QueueStore.clear();

        //2. optimistic ui
        renderQueue();

        try {
            await queueClear();
        } catch (err) {
            logDebug("[onClickClearQueue] Failed to clear backend queue:", err);
        }
    }
}



//clicking the queue list will check for this
export async function onClickQueueList(e) {
    //check what was clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    //handle button or whole row pressed
    if (button) {
        if (button.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(dataset);

        } else if (button.classList.contains("more-button")) {
            logDebug("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        logDebug("Play clicked");
        await onClickPlayButton(dataset);
    }
}


//helpers
async function onClickPlayButton(dataset) {
    const start = performance.now();

    //0. parse data
    const trackId = dataset.trackId;

    if (!trackId) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    //1. make changes to local queue
    QueueStore.setFirst(trackId);

    //2. attempt loading after cleanup
    try {
        await cleanupCurrentAudio();
        await loadTrack(trackId);
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to clean or load audio:", err);
    }

    //3. make optimistic ui changes
    const track = TrackStore.get(trackId);
    logDebug("TRACK LOAD COMPLETE, WAITING FOR TRACK:", track);

    updateMediaSession(track, true);
    renderQueue();
    resetUI();
    updatePlayPauseButtonDisplay(true);

    //4. send changes to server (returns websocket message to sync ui)
    try {
        await queueSetFirstTrack(trackId);
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to set first track in backend:", err);
    }

    try {
        //5. play audio
        await playLoadedTrack();
    } catch (err) {
        logDebug("[onClickPlayButton] Failed to play audio:", err);
    }

    const end = performance.now();
    const elapsed = (end - start).toFixed(1);
    logDebug(`[onClickPlayButton] Total elapsed: ${elapsed} ms`);
}


async function onClickQueueButton(dataset) {
    //0. parse data
    const trackId = dataset.trackId;

    if (!trackId) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    const track = TrackStore.get(trackId);
    if (!track) {
        logDebug("Missing track in TrackStore");
        return;
    }
    
    //1. optimistic ui update
    QueueStore.push(trackId);
    renderQueue();

    //2. update queue (local and backend)
    try {
        showToast(`Queued`);

        await queuePushTrack(trackId);
    } catch (err) {
        logDebug("Failed to queue audio:", err);
    }
}



//onSwipe is defined in frontend/js/features/playlist/controller.js