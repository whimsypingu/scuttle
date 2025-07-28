//static/js/events/websocket/websocket.js

import { $, SELECTORS } from "../../dom/index.js";
import { renderLibraryList } from "../../features/library/index.js";
import { renderQueueList } from "../../features/queue/index.js";
import { initWebSocket } from "./socket.js";

//sets up a websocket
export function setupWebSocket() {
    const socket = initWebSocket();
    socket.onmessage = (messageEvent) => {
        try {
            const message = JSON.parse(messageEvent.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
        }
    };

}

//handles websocket messages //later this should be migrated from the backend to ensure consistency
const handlers = {
    play_queue: {
        set_first: tempQueueHandler,
        insert_next: tempQueueHandler,
        push: tempQueueHandler,
        pop: tempQueueHandler,
        remove: tempQueueHandler
    },
    audio_database: {
        search: tempLibraryHandler,
    },
    youtube_client: {
        search: tempLibraryHandler,
    }
}

function handleWebSocketMessage(message) {

    //defense
    if (!message || typeof message.source !== "string" || typeof message.action !== "string") {
        console.warn("Invalid WebSocket message format:", message);
        return;
    }

    //debug
    console.log("WebSocket message received:", message);

    //handler logic
    const { source, action, payload } = message;

    const handler = handlers[source][action];
    if (handler) {
        handler(payload);
    } else {
        console.warn("Unhandled Websocket source or action:", source, action);
    }
}

function tempQueueHandler(payload) {
    renderQueueList($(SELECTORS.queue.ids.LIST), payload.content);
}

function tempLibraryHandler(payload) {
    console.log("tempLibraryHandler called with payload content:", payload.content);
    renderLibraryList($(SELECTORS.library.ids.LIST), payload.content);
}

