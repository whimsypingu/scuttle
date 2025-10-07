//static/js/events/websocket/websocket.js

import { destroyWebSocket, initWebSocket } from "./socket.js";
import { handlers } from "./handlers.js";
import { logDebug } from "../../utils/debug.js";

//sets up a websocket
export function setupWebSocket() {
    const socket = initWebSocket();
    socket.onmessage = (messageEvent) => {
        try {
            const message = JSON.parse(messageEvent.data);
            handleWebSocketMessage(message);
        } catch (err) {
            logDebug("Failed to parse WebSocket message:", err);
        }
    };

    // reconnect if tab becomes visible
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && (!socket || socket.readyState !== WebSocket.OPEN)) {
            logDebug("Tab visible, reconnecting WebSocket...");
            setupWebSocket();
        }

        else if (document.visibilityState === "hidden") {
            logDebug("Tab hidden, destroying WebSocket...");
            destroyWebSocket();
        }
    });
}

function handleWebSocketMessage(message) {

    //defense
    if (!message || typeof message.source !== "string" || typeof message.action !== "string") {
        logDebug("[WARN] Invalid WebSocket message format:", message);
        return;
    }

    //debug
    logDebug("WebSocket message received:", message);

    //handler logic
    const { source, action, payload } = message;

    const handler = handlers[source][action];
    if (handler) {
        handler(payload);
    } else {
        logDebug("[WARN] Unhandled Websocket source or action:", source, action);
    }
}
