//static/js/events/websocket/handlers.js

import { $, SELECTORS } from "../../dom/index.js";
import { renderPlaylist } from "../../features/playlist/index.js";


import { setLocalQueue } from "../../cache/index.js";


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
        fetch_likes: handleADFL,
        
        download: handleADDO
    },
    youtube_client: {
        search: handleYTSE,
    }
}

//player queue related websocket messages update the state of the local queue (for caching), and also the ui
function handlePQSF(payload) {
    setLocalQueue(payload.content);
}

function handlePQIN(payload) {
    setLocalQueue(payload.content);
}

function handlePQPU(payload) {
    setLocalQueue(payload.content);
}

function handlePQPO(payload) {
    setLocalQueue(payload.content);
}

function handlePQRE(payload) {
    setLocalQueue(payload.content);
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