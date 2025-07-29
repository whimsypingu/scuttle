//static/js/events/websocket/handlers.js

import { $, SELECTORS } from "../../dom/index.js";
import { renderQueueList } from "../../features/queue/index.js";
import { renderLibraryList } from "../../features/library/index.js";



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



const queueListEl = $(SELECTORS.queue.ids.LIST)

function handlePQSF(payload) {
    renderQueueList(queueListEl, payload.content);
}

function handlePQIN(payload) {
    renderQueueList(queueListEl, payload.content);
}

function handlePQPU(payload) {
    renderQueueList(queueListEl, payload.content);
}

function handlePQPO(payload) {
    renderQueueList(queueListEl, payload.content);
}

function handlePQRE(payload) {
    renderQueueList(queueListEl, payload.content);
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