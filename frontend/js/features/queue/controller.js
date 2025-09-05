//static/js/features/queue/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    loadTrack, 
    playLoadedTrack,
    cleanupCurrentAudio,

    updatePlayPauseButtonDisplay,

    resetUI,
    updateMediaSession
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack,
    redrawQueueUI,
} from "./index.js";

import { QueueStore } from "../../cache/QueueStore.js";





//clicking the queue list will check for this
export async function onClickQueueList(e, domEls) {
    //check what was clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    //handle button or whole row pressed
    if (button) {
        if (button.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(domEls, dataset);

        } else if (button.classList.contains("more-button")) {
            logDebug("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        logDebug("Play clicked");
        await onClickPlayButton(domEls, dataset);
    }

}


//helpers
async function onClickPlayButton(domEls, dataset) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;

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
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);

        //3. make optimistic ui changes
        updateMediaSession(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
        resetUI(track, titleEl, authorEl, audioEl, currTimeEl, progBarEl, durationEl);
        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //4. play audio
        await playLoadedTrack(audioEl);

        //5. send changes to server (returns websocket message to sync ui)
        await queueSetFirstTrack(track.id);

    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
}


async function onClickQueueButton(domEls, dataset) {
    const { titleEl, authorEl, queueListEl } = domEls;

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
        redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
        showToast(`Queued`);

        await queuePushTrack(track.id);
    } catch (err) {
        logDebug("Failed to queue audio:", err);
    }
}



//onSwipe is defined in library and i think works for both... consider moving to a separate swipe function