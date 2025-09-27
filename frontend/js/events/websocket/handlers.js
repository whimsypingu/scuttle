//static/js/events/websocket/handlers.js

import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { $, SELECTORS } from "../../dom/index.js";
import { renderNewCustomPlaylist, renderPlaylist } from "../../features/playlist/index.js";
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
const searchDropdownEl = $(SELECTORS.search.ids.DROPDOWN);

function handleADSE(payload) {
    //do something with RecentStore.js here
    renderPlaylist(searchDropdownEl, payload.content);
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
    renderPlaylist(searchDropdownEl, payload.content);
}

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