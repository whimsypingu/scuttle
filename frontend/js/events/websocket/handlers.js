//static/js/events/websocket/handlers.js

import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { $, SELECTORS } from "../../dom/index.js";
import { renderNewCustomPlaylist, renderPlaylist } from "../../features/playlist/index.js";




//handles websocket messages //later this should be migrated from the backend to ensure consistency
export const handlers = {
    play_queue: {
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
    }
}

//player queue related websocket messages update the state of the local queue (for caching), and also the ui
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




const libraryListEl = $(SELECTORS.library.ids.LIST)

function handleADSE(payload) {
    renderPlaylist(libraryListEl, payload.content);
}

function handleADDO(payload) {
    renderPlaylist(libraryListEl, payload.content);
}

function handleYTSE(payload) {
    renderPlaylist(libraryListEl, payload.content);
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