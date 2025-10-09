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
    renderQueue,

    //queueClear
} from "./index.js";

import { QueueStore } from "../../cache/QueueStore.js";

import { fisherYatesShuffle } from "../playlist/index.js";



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

    try {
        //1. make changes to local queue
        QueueStore.setFirst(track.id);

        //2. load in the audio
        await cleanupCurrentAudio();
        await loadTrack(track.id);

        //3. make optimistic ui changes
        updateMediaSession(track, true);
        renderQueue();
        resetUI();
        updatePlayPauseButtonDisplay(true);
        
        //4. play audio
        await playLoadedTrack();

        //5. send changes to server (returns websocket message to sync ui)
        await queueSetFirstTrack(track.id);

    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
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

    //1. update queue (local and backend)
    try {
        QueueStore.push(track.id);
        renderQueue();
        showToast(`Queued`);

        await queuePushTrack(track.id);
    } catch (err) {
        logDebug("Failed to queue audio:", err);
    }
}



//onSwipe is defined in frontend/js/features/playlist/controller.js