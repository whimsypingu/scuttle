//static/js/api/websocket/websocket-api.js

import { handleWebSocketMessage } from "../../events/websocket/websocket-events.js";

let socket = null;

export function initWebSocket(url) {
    if (socket) {
        console.warn("Websocket is already initialized");
        return;
    };

    socket = new WebSocket("ws://localhost:8000/websocket");

    socket.onopen = () => {
        console.log("WebSocket connection established.");
    };

    socket.onmessage = (messageEvent) => {
        try {
            const message = JSON.parse(messageEvent.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
        }
    };

    socket.onclose = () => {
        console.warn("WebSocket connection closed.");
        socket = null;
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
    };
}