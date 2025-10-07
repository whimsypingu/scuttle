//static/js/websocket/socket.js

import { logDebug } from "../../utils/debug.js";

let socket = null;

const reconnectTimeout = 3000; //ms

export function initWebSocket() {

    //websocket failure ciould be that you have to pip install "uvicorn[standard]" for websocket support

    if (socket && socket.readyState === WebSocket.OPEN) {
        logDebug("[WARN] WebSocket already initialized");
        return socket;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"; //use wss if https, otherwise ws for http
    const host = window.location.host; // includes hostname + port
    const webSocketUrl = `${protocol}://${host}/websocket`;

    socket = new WebSocket(webSocketUrl); //ex. "ws://localhost:8000/websocket");

    socket.onopen = () => {
        logDebug("WebSocket connection established.");
    };

    socket.onclose = (event) => {
        logDebug("[WARN] WebSocket connection closed.", event.code, event.reason); //1006 on ios typically
        socket = null;
        setTimeout(initWebSocket, reconnectTimeout);
    };

    socket.onerror = (err) => {
        logDebug("[ERROR] WebSocket error:", err); //ios gives vague websocket failure
    };

    return socket;
}

export function destroyWebSocket() {
    if (socket) {
        logDebug("[INFO] Destroying WebSocket connection");
        socket.onopen = socket.onclose = socket.onmessage = socket.onerror = null;
        socket.close();
        socket = null;
    }
}



export function getWebSocket() {
    if (!socket) {
        logDebug("[WARN] WebSocket not initialized. Call initWebSocket() first.");
    }
    return socket;
}
