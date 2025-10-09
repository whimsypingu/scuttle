//static/js/features/library/controller.js

import { logDebug } from "../../utils/debug.js";

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
    queuePushFrontTrack,
    queueSetAllTracks,
    queueSetFirstTrack,
    renderQueue,
    queueRemoveTrack
} from "../queue/index.js";

import { toggleLike } from "./lib/api.js";

import { renderPlaylist } from "./lib/ui.js";

import { QueueStore } from "../../cache/QueueStore.js";
import { LikeStore } from "../../cache/LikeStore.js";
import { showEditTrackPopup } from "../popup/controller.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { showToast } from "../toast/index.js";

import { fisherYatesShuffle, getPlaylistIds } from "./lib/utils.js";



//clicking the playlist will check for this
export async function onClickPlaylist(e) {
    //check what was clicked
    const buttonEl = e.target.closest("button");

    //closest playlist for id
    const playlistEl = e.target.closest(".playlist");
    const playlistDataset = playlistEl?.dataset;

    //closest list element
    const li = e.target.closest("li.list-track-item"); //why dont i use liEl? it looks ugly
    const liDataset = li?.dataset;

    //handle button or whole row pressed
    if (buttonEl) {

        //playlist-wide play or shuffle buttons
        if (buttonEl.classList.contains("play-playlist-button")) {
            logDebug("Play playlist clicked");
            await onClickPlayPlaylistButton(playlistDataset);

        } else if (buttonEl.classList.contains("shuffle-playlist-button")) {
            logDebug("Shuffle playlist clicked");
            await onClickShufflePlaylistButton(playlistDataset);
        } 
        
        //individual buttons clicked (desktop)?
        else if (buttonEl.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(liDataset);

        } else if (buttonEl.classList.contains("more-button")) {
            logDebug("more //BUILD ME", liDataset);
        }
    } else if (li) {
        logDebug("Play clicked");
        await onClickPlayButton(liDataset);
    }
}



//play an entire playlist
async function onClickPlayPlaylistButton(dataset) {
    const queueIds = getPlaylistIds(dataset);

    try {
        //1. set queue locally
        QueueStore.setAll(queueIds);

        //2. load in audio
        const trackId = QueueStore.peekId();

        await cleanupCurrentAudio();
        await loadTrack(trackId);

        //3. make optimistic ui changes
        const track = TrackStore.get(trackId);
        logDebug("TRACK LOAD COMPLETE, WAITING FOR TRACK:", track);

        updateMediaSession(track, true);
        renderQueue();
        resetUI();
        updatePlayPauseButtonDisplay(true);

        //4. play audio
        await playLoadedTrack();
    
        //5. sync with backend
        await queueSetAllTracks(queueIds);
    } catch (err) {
        logDebug("Failed to play playlist:", err);
    }
}



//shuffle an entire playlist
async function onClickShufflePlaylistButton(dataset) {
    const queueIds = getPlaylistIds(dataset);
    const shuffledIds = fisherYatesShuffle(queueIds);

    try {
        //1. set queue locally
        QueueStore.setAll(shuffledIds);

        //2. load in audio
        const trackId = QueueStore.peekId();

        await cleanupCurrentAudio();
        await loadTrack(trackId);

        //3. make optimistic ui changes
        const track = TrackStore.get(trackId);
        logDebug("TRACK LOAD COMPLETE, WAITING FOR TRACK:", track);

        updateMediaSession(track, true);
        renderQueue();
        resetUI();
        updatePlayPauseButtonDisplay(true);

        //4. play audio
        await playLoadedTrack();

        //5. sync with backend
        await queueSetAllTracks(shuffledIds);
    } catch (err) {
        logDebug("Failed to shuffle/play playlist:", err);
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


async function onClickQueueFrontButton(dataset) {
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
    QueueStore.pushFront(trackId);
    renderQueue();

    //2. update queue (local and backend)
    try {
        showToast(`Queued`);

        await queuePushFrontTrack(trackId);
    } catch (err) {
        logDebug("Failed to front queue audio:", err);
    }
}




//which action to do "queue", "more"
import { domEls } from "../../dom/selectors.js";
const { likedListEl } = domEls;

export async function onSwipe(dataset, actionName) {
    const trackId = dataset.trackId;

    //0. parse data
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
    logDebug("[onSwipe] actionName:", actionName);

    switch (actionName) {
        case "queue":
            QueueStore.push(trackId);
            renderQueue();
            
            showToast(`Queued`); //optionally include track.title but should probably prevent js injection

            try {
                await queuePushTrack(trackId); //backend
            } catch (err) {
                logDebug("Queue failed", err);
            }
            break;

        case "queueFirst":
            QueueStore.pushFront(trackId);
            renderQueue();

            showToast(`Next`);

            try {
                await queuePushFrontTrack(trackId);
            } catch (err) {
                logDebug("Queue failed", err);
            }
            break;

        case "like":
            const liked = LikeStore.toggle(trackId);
            renderPlaylist(likedListEl, LikeStore.getTracks());

            showToast(liked ? "Liked" : "Unliked");

            try {
                await toggleLike(trackId); //backend
            } catch (err) {
                logDebug("Like failed", err);
            }
            break;

        case "more":
            try {
                showEditTrackPopup(trackId);
            } catch (err) {
                logDebug("More failed", err);
            }
            break;

        case "remove": 
            //either way, all infrastructure should be able to safely handle invalid (-1) indices
            //-1 => untracked, 0 => currently playing, 1+ => in queue (renderQueue should handle this correctly)
            //this is for removing from queue only, see frontend/js/dom/builders/list.js
            const index = dataset.index;
            const removedId = QueueStore.removeAt(trackId, index);

            logDebug(`[remove] track name: ${track.title}, index: ${index}, trackId: ${trackId}, removedId: ${removedId}`);

            if (removedId) {
                renderQueue();

                showToast(`Removed`);

                try {
                    await queueRemoveTrack(trackId, index);
                } catch (err) {
                    logDebug("Remove failed", err);
                }
            }
            break;
        
        default:
            logDebug("[onSwipe] unknown swipe actionName, how did we get here??");
            break;
    }
}
