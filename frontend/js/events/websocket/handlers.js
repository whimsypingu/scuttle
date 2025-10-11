//static/js/events/websocket/handlers.js

import { LikeStore } from "../../cache/LikeStore.js";
import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { $, SELECTORS, SEARCH_ACTIONS } from "../../dom/index.js";
import { 
    deleteRenderPlaylistById, 
    renderLibrary, 
    renderLiked, 
    renderNewCustomPlaylist, 
    renderPlaylist, 
    renderPlaylistById, 
    updateAllListTrackItems } from "../../features/playlist/index.js";
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
        set_metadata: handleADSetMetadata,

        create_playlist: handleADCreatePlaylist,
        update_playlists: handleADUpdatePlaylists,
        edit_playlist: handleADEditPlaylist,
        delete_playlist: handleADDeletePlaylist,

        //log_track: handleADLogTrack,
        //unlog_track: handleADUnlogTrack,
        log_download: handleADLogDownload,
        unlog_download: handleADUnlogDownload,

        search: handleADSearch,
        fetch_likes: handleADFetchLikes,
    },
    youtube_client: {
        //search: handleYTSE,
        //download: handleYTDO,

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




const searchListEl = $(SELECTORS.search.ids.LIST);
const customPlaylistEl = $(SELECTORS.playlists.ids.CUSTOM);

function handleADCreatePlaylist(payload) {
    const tempId = String(payload.content.temp_id);
    const newId = String(payload.content.id);
    const name = payload.content.name;

    console.log("DEBUGGING:", tempId, newId);

    PlaylistStore.updateId(tempId, newId);
    renderNewCustomPlaylist(customPlaylistEl, name, newId, tempId);
}

function handleADSetMetadata(payload) {
    console.log("[handleADSetMetadata]:", payload.content);

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

function handleADUpdatePlaylists(payload) {
    //see backend/core/database/audio_database.py
    const trackId = payload.content.id;
    const updates = payload.content.updates;

    console.log("[handleADUpdatePlaylists] updates:", updates);

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

function handleADEditPlaylist(payload) {
    //see backend/core/database/audio_database.py
    console.log("[handleADEditPlaylist] payload:", payload);
    const playlistId = payload.content.id;
    const name = payload.content.name;

    //console.log("[handleADEditPlaylist] edits:", playlistId, name);
    PlaylistStore.editName(playlistId, name);

    renderPlaylistById(playlistId);
}

function handleADDeletePlaylist(payload) {
    const playlistId = payload.content.id;

    console.log("[handleADDeletePlaylist] deleted");
    PlaylistStore.removePlaylist(playlistId);

    deleteRenderPlaylistById(playlistId);
}


function handleADLogDownload(payload) {
    console.log("[handleADLogDownload] payload content:", payload.content);

    const track = payload.content;

    showToast(`Downloaded ${track.title}`);

    TrackStore.insert(track);
    renderLibrary();
}

function handleADUnlogDownload(payload) {
    console.log("[handleADUnlogDownload] payload content:", payload.content);

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



function handleADSearch(payload) {
    //do something with RecentStore.js here
    renderPlaylist(searchListEl, payload.content, false, SEARCH_ACTIONS);
}


function handleADFetchLikes(payload) {
    LikeStore.setAll(payload.content);
    renderLiked();
}




