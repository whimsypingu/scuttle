//static/js/events/websocket/websocket-events.js

import { renderQueueList } from "../../ui/index.js";

export function handleWebSocketMessage(message) {
    const { action, name, queue } = message;

    console.log("WebSocket message received:", message)

    switch (action) {
        case "add":;
            renderQueueList(queue);
            break;
        default: 
            console.warn("Unhandled WebSocket action:", action);
    }
}