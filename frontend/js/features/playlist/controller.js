//static/js/features/library/controller.js

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
    redrawQueueUI
} from "../queue/index.js";

import { toggleLike } from "./lib/api.js";

import { logDebug } from "../../utils/debug.js";
import { renderPlaylist } from "./lib/ui.js";

import { QueueStore } from "../../cache/QueueStore.js";
import { LikeStore } from "../../cache/LikeStore.js";
import { showEditTrackPopup } from "../popup/controller.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { showToast } from "../toast/index.js";


//clicking the library list will check for this
export async function onClickPlaylist(e, domEls) {
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
        //1. make changes to local queue, which triggers queue ui update
        QueueStore.setFirst(track.id);

        //2. load in the audio
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);

        //3. make optimistic ui changes
        updateMediaSession(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
        resetUI(audioEl, currTimeEl, progBarEl, durationEl);
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




//which action to do "queue", "more"
export async function onSwipe(domEls, dataset, action) {
    const { titleEl, authorEl, queueListEl, likedListEl } = domEls;

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

    //1. handle action type
    if (action === "queue") {
        try {
            QueueStore.push(track.id);
            redrawQueueUI(queueListEl, titleEl, authorEl, QueueStore.getTracks());
            showToast(`Queued`); //optionally include track.title but should probably prevent js injection

            await queuePushTrack(track.id); //backend

            logDebug("Queue swiped");
        } catch (err) {
            logDebug("Queue failed", err);
        }
    } else if (action === "like") {
        try {
            const liked = LikeStore.toggle(track.id);
            renderPlaylist(likedListEl, LikeStore.getTracks());
            showToast(liked ? "Liked" : "Unliked");

            //test
            logDebug("TEST: LIKE:", LikeStore.getTracks());

            await toggleLike(track.id); //backend
            
            logDebug("Like swiped");
        } catch (err) {
            logDebug("Like failed", err);
        }
    } else if (action === "more") {
        
        try {
            showEditTrackPopup(domEls, track.id);
            logDebug("more //BUILD ME", track);
        } catch (err) {
            logDebug("More failed", err);
        }

    } else {
        logDebug("unknown swipe action, how did we get here?");
    }
}
