//static/js/events/websocket/websocket.js

import { initWebSocket } from "./socket.js";
import { handlers } from "./handlers.js";

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
