//static/js/features/library/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

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
    queueSetAllTracks,
    queueSetFirstTrack,
    renderQueue
} from "../queue/index.js";

import { toggleLike } from "./lib/api.js";

import { logDebug } from "../../utils/debug.js";
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
    //0. parse data
    const trackId = dataset.trackId;

    if (!trackId) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    const response = await getAudioStream(trackId);
    if (!response.ok) {
        logDebug("Track is downloading, please wait :)");
        return;
    }

    try {
        //1. make changes to local queue
        //console.log("QueueStore check 1:", QueueStore.getTracks());
        QueueStore.setFirst(trackId);
        //console.log("QueueStore check 2:", QueueStore.getTracks());

        //2. load in the audio
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




//which action to do "queue", "more"
import { domEls } from "../../dom/selectors.js";
const { likedListEl } = domEls;

export async function onSwipe(dataset, action) {

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
            renderQueue();
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
            showEditTrackPopup(track.id);
            logDebug("more //BUILD ME", track);
        } catch (err) {
            logDebug("More failed", err);
        }

    } else {
        logDebug("unknown swipe action, how did we get here?");
    }
}
