//static/js/events/websocket/handlers.js

import { LikeStore } from "../../cache/LikeStore.js";
import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { $, SELECTORS } from "../../dom/index.js";
import { renderLibrary, renderLiked, renderNewCustomPlaylist, renderPlaylist, renderPlaylistById, updateAllListTrackItems } from "../../features/playlist/index.js";
import { hideSpinner, showSpinner } from "../../features/spinner/index.js";
import { showToast } from "../../features/toast/index.js";




//handles websocket messages //later this should be migrated from the backend to ensure consistency
export const handlers = {
    play_queue: {
        set_all: handlePQSA,
        set_first: handlePQSF,
        insert_next: handlePQIN,
        push: handlePQPU,
        pop: handlePQPO,
        remove: handlePQRE
    },
    audio_database: {
        set_metadata: handleADSM,
        edit_playlist: handleADEP,
        delete_track: handleADDT,

        search: handleADSE,
        create_playlist: handleADCP,
        fetch_likes: handleADFL,

        download: handleADDO
    },
    youtube_client: {
        search: handleYTSE,
        download: handleYTDO,

        task_start: handleTaskStart,
        task_finish: handleTaskFinish,
    }
}



//spinner, can also include toasts for when downloads start and are complete.
function handleTaskStart(payload) {
    showSpinner();
}
function handleTaskFinish(payload) {
    hideSpinner();
}



//player queue related websocket messages update the state of the local queue (for caching), and also the ui
function handlePQSA(payload) {
    //sync up queue and render?
}

function handlePQSF(payload) {
    //sync up queue and render?
}

function handlePQIN(payload) {
    //sync up queue and render?
}

function handlePQPU(payload) {
    //sync up queue and render?
}

function handlePQPO(payload) {
    //sync up queue and render?
}

function handlePQRE(payload) {
    //sync up queue and render?
}




const libraryListEl = $(SELECTORS.library.ids.LIST);
const searchListEl = $(SELECTORS.search.ids.LIST);

function handleADSM(payload) {
    console.log("SET_METADATA RECEIVED:", payload.content);

    const trackId = payload.content.id;
    const customTitle = payload.content.title;
    const customArtist = payload.content.artist;

    //update the local TrackStore
    TrackStore.update(trackId, {
        title: customTitle,
        artist: customArtist
    })
    console.log("TRACKSTORE:", TrackStore.get(trackId));

    updateAllListTrackItems(trackId, customTitle, customArtist);

    //notif
    showToast("Saved");
}

function handleADEP(payload) {
    //see backend/core/database/audio_database.py
    const trackId = payload.content.id;
    const updates = payload.content.updates;

    console.log("UPDATES:", updates);

    for (const { id, checked } of updates) {
        const inPlaylist = PlaylistStore.hasTrack(id, trackId);

        if (checked && !inPlaylist) {
            //user checked but not in playlist -> add
            PlaylistStore.addTrackId(id, trackId);

            renderPlaylistById(id);
        } else if (!checked && inPlaylist) {
            //user unchecked and in playlist -> remove
            PlaylistStore.removeTrack(id, trackId);

            renderPlaylistById(id);
        } else {
            console.log("SYNCED");
        }
    }

    //ignore notif because frontend handles optimistically
}

function handleADDT(payload) {
    console.log("DELETE_TRACK RECEIVED:", payload.content);

    //update local stores
    const trackId = payload.content.id;

    TrackStore.remove(trackId);
    renderLibrary();
    
    LikeStore.remove(trackId);
    renderLiked();

    const allPlaylists = PlaylistStore.getAll();
    Object.keys(allPlaylists).forEach(playlistId => {
        PlaylistStore.removeTrack(playlistId, trackId);

        renderPlaylistById(playlistId);
    })
    
    //notif
    showToast("Deleted");
}



function handleADSE(payload) {
    //do something with RecentStore.js here
    renderPlaylist(searchListEl, payload.content);
}

function handleADDO(payload) {
    //renderPlaylist(libraryListEl, payload.content);
}

function handleYTSE(payload) {

    const tracks = payload.content || [];
    for (const track of tracks) {
        TrackStore.insert(track)
    }

    console.log("TRACKSTORE:", TrackStore.getTracks());
    renderPlaylist(searchListEl, payload.content);
}

//actual download message
function handleYTDO(payload) {
    const track = payload.content;

    const tracks = TrackStore.getTracks();
    tracks.unshift(track);

    TrackStore.insert(track);

    console.log("TRACKS:", tracks);
    renderPlaylist(libraryListEl, tracks);

    showToast(`Downloaded ${track.title}`);
}



//whenever liked list gets updated in the backend sync up
const likedListEl = $(SELECTORS.liked.ids.LIST)

function handleADFL(payload) {
    renderPlaylist(likedListEl, payload.content);
}


const customPlaylistEl = $(SELECTORS.playlists.ids.CUSTOM);

function handleADCP(payload) {
    const tempId = payload.content.temp_id;
    const newId = payload.content.id;
    const name = payload.content.name;

    console.log("DEBUGGING:", tempId, newId);

    PlaylistStore.updateId(tempId, newId);
    renderNewCustomPlaylist(customPlaylistEl, name, newId, tempId);
}