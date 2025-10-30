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
    queueRemoveTrack,
    conditionalPrefetch,
    prefetchTrack
} from "../queue/index.js";

import { reorderPlaylist, toggleLike } from "./lib/api.js";

import { renderPlaylist, renderPlaylistById } from "./lib/ui.js";

import { QueueStore } from "../../cache/QueueStore.js";
import { LikeStore } from "../../cache/LikeStore.js";

import { showEditPlaylistPopup, showEditTrackPopup } from "../popup/controller.js";

import { TrackStore } from "../../cache/TrackStore.js";
import { showToast } from "../toast/index.js";

import { fisherYatesShuffle, getPlaylistData, getPlaylistTrackIds } from "./lib/utils.js";


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
        
        } else if (buttonEl.classList.contains("edit-playlist-button")) {
            //edit or delete playlist
            logDebug("Edit playlist clicked");
            await onClickEditPlaylistButton(playlistDataset);
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
    const queueIds = getPlaylistTrackIds(dataset);

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
    const queueIds = getPlaylistTrackIds(dataset);
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



//edit the playlist
async function onClickEditPlaylistButton(dataset) {
    const { playlistId } = getPlaylistData(dataset);
    
    try {
        showEditPlaylistPopup(playlistId);
    } catch (err) {
        logDebug("[onClickEditPlaylistButton] popup failed");
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
        await conditionalPrefetch();
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
import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { renderLiked } from "./index.js";
const { likedListEl } = domEls;

/**
 * Handle swipe actions on track list items.
 *
 * Depending on the `actionName`, this function performs different queue or like actions:
 * - `"queue"`: Push the track to the end of the queue (frontend + backend).
 * - `"queueFirst"`: Push the track to the **front** of the queue (i.e., play next).
 * - `"like"`: Toggle like/unlike state for the track (frontend + backend).
 * - `"more"`: Show the edit popup for the track.
 * - `"remove"`: Remove the track from the queue at a specific index.
 *
 * @param {DOMStringMap} dataset - The `data-*` attributes of the swiped element. Should include `trackId` and optionally `index`.
 * @param {string} actionName - The name of the action to perform (e.g. `"queue"`, `"like"`, `"remove"`).
 */
export async function onSwipe(dataset, actionName) {
    const trackId = dataset.trackId;

    //0. parse data
    if (!trackId) {
        logDebug("Missing track data attributes in dataset");
        return;
    }


    const isDownloaded = dataset.isDownloaded === "true"; //dataset are strings

    //1. handle action type
    logDebug("[onSwipe] actionName:", actionName);

    switch (actionName) {
        case "queue":
            // Add to end of the queue (frontend first for snappy UI)
            if (!isDownloaded) {
                showToast("Downloading...");
            } else {
                QueueStore.push(trackId);
                renderQueue();
                showToast(`Queued`); //optionally include track.title but should probably prevent js injection
            }

            try {
                await queuePushTrack(trackId); //backend
                await conditionalPrefetch();
            } catch (err) {
                logDebug("Queue failed", err);
            }
            break;

        case "queueFirst":
            // Insert track at the front of the queue (to be played next)
            if (!isDownloaded) {
                showToast("Downloading...");
            } else {
                QueueStore.pushFront(trackId);
                renderQueue();
                showToast(`Next`);
            }

            try {
                await queuePushFrontTrack(trackId);
            } catch (err) {
                logDebug("Queue failed", err);
            }
            break;

        case "like":
            // Toggle like state locally and update the playlist UI
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
            // Open track edit popup
            try {
                showEditTrackPopup(trackId);
            } catch (err) {
                logDebug("More failed", err);
            }
            break;

        case "remove": 
            /**
             * Remove a track from the queue at the given index.
             * - index -1: untracked (should be handled gracefully (by frontend QueueStore and backend ObservableQueue)
             * - index 0: currently playing track (renderQueue should handle true QueueStore index assignment correctly)
             * - index 1+: in queue
             */
            const index = dataset.index;
            const removedId = QueueStore.removeAt(trackId, index);

            //logDebug(`[remove] track name: ${track.title}, index: ${index}, trackId: ${trackId}, removedId: ${removedId}`);

            if (removedId) {
                renderQueue();

                showToast(`Removed`);

                try {
                    await queueRemoveTrack(trackId, index); //backend sync
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


/**
 * Handle track reordering within playlists, the queue, or the liked list.
 *
 * This function updates both the frontend order (for instant UI feedback)
 * and the backend database to persist the new order.
 *
 * Depending on the playlist type, reordering behaves differently:
 * 
 * - `"liked"`: Reorders tracks in the Liked Songs list, then calls the backend
 *   to persist the new order using `reorderPlaylist()`.
 * 
 * - `"queue"`: Reorders the current play queue locally and sends the full
 *   reordered list of track IDs to the backend using `queueSetAllTracks()`. Should change this though
 * 
 * - *(default)* User-created playlists: Reorders tracks within the specified
 *   playlist locally, re-renders it, and updates the backend via `reorderPlaylist()`.
 *
 * If the `fromIndex` and `toIndex` are the same, the function exits early.
 *
 * @param {DOMStringMap} dataset - The `data-*` attributes of the dragged element.
 *   Must contain identifying information used by `getPlaylistData()` to resolve `playlistId`.
 * @param {number} fromIndex - The 0-based index of the track being moved.
 * @param {number} toIndex - The 0-based index where the track should be placed.
 *
 * @example
 * // Move a track from index 2 to index 5 in the user's playlist
 * onReorder({ playlistId: "12" }, 2, 5);
 *
 * @example
 * // Move a track to the top of the Liked Songs list
 * onReorder({ playlistId: "liked" }, 10, 0);
 */
export async function onReorder(dataset, fromIndex, toIndex) {
    const { playlistId } = getPlaylistData(dataset);

    console.log("[onReorder]: fromIndex:", fromIndex, " toIndex:", toIndex);
    if (parseInt(fromIndex) == parseInt(toIndex)) return;

    switch (playlistId) {
        case "liked":
            LikeStore.reorder(fromIndex, toIndex);
            renderLiked();

            try {
                await reorderPlaylist(playlistId, fromIndex, toIndex);
            } catch (err) {
                logDebug(`reorder liked failed: ${err}`);
            }
            break; 
        
        case "queue":
            QueueStore.reorder(fromIndex, toIndex);
            renderQueue();

            try {
                const trackIds = QueueStore.getIds();
                await queueSetAllTracks(trackIds);
            } catch (err) {
                logDebug("Queueset failed", err);
            }
            break;

        default:
            //user playlist
            PlaylistStore.reorderTrack(playlistId, fromIndex, toIndex);
            renderPlaylistById(playlistId);

            // const tracks = PlaylistStore.getTracks(playlistId);
            // tracks.forEach((track, index) => {
            //     logDebug(`${index + 1}: ${track.title}`); // or track.title if that’s your property
            // });

            try {
                await reorderPlaylist(playlistId, fromIndex, toIndex);
            } catch (err) {
                logDebug(`reorder playlist ${playlistId} failed: ${err}`);
            }
            break;
    }
}