//static/js/events/websocket/handlers.js

import { $, SELECTORS } from "../../dom/index.js";
import { renderLibraryList } from "../../features/library/index.js";

import { renderQueueUI } from "../../features/queue/controller.js";

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
        download: handleADDO
    },
    youtube_client: {
        search: handleYTSE,
    }
}


const domEls = {
    queueListEl: $(SELECTORS.queue.ids.LIST),
    titleEl: $(SELECTORS.audio.ids.TITLE),
    authorEl: $(SELECTORS.audio.ids.AUTHOR),

    libraryListEl: $(SELECTORS.library.ids.LIST),
}

//player queue related websocket messages update the state of the local queue (for caching), and also the ui
function handlePQSF(payload) {
    setLocalQueue(payload.content);
    renderQueueUI(domEls, payload.content);
}

function handlePQIN(payload) {
    setLocalQueue(payload.content);
    renderQueueUI(domEls, payload.content);
}

function handlePQPU(payload) {
    setLocalQueue(payload.content);
    renderQueueUI(domEls, payload.content);
}

function handlePQPO(payload) {
    setLocalQueue(payload.content);
    renderQueueUI(domEls, payload.content);
}

function handlePQRE(payload) {
    setLocalQueue(payload.content);
    renderQueueUI(domEls, payload.content);
}




const libraryListEl = $(SELECTORS.library.ids.LIST)

export function handleADSE(payload) {
    renderLibraryList(libraryListEl, payload.content);
}

export function handleADDO(payload) {
    renderLibraryList(libraryListEl, payload.content);
}

export function handleYTSE(payload) {
    renderLibraryList(libraryListEl, payload.content);
}