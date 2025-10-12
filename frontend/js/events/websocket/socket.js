//static/js/websocket/socket.js

import { showToast } from "../../features/toast/index.js";
import { logDebug } from "../../utils/debug.js";


/**
 * Global reference to the active WebSocket connection.
 * May be null if the connection is closed or not yet initialized.
 * @type {WebSocket | null}
 */
let socket = null;


/**
 * How long (in milliseconds) to wait before automatically attempting
 * to reconnect after an unexpected close.
 * 
 * @type {number}
 */
const reconnectTimeout = 3000; //ms


/**
 * Initialize and open a WebSocket connection to the server if not already open.
 *
 * - Determines the correct protocol (`ws` vs `wss`) based on the current page.
 * - Creates the WebSocket instance and attaches event listeners.
 * - Automatically schedules a reconnect on unexpected close.
 * 
 * If a socket is already open, this function simply returns the existing instance.
 *
 * @returns {WebSocket} The active WebSocket instance.
 */
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
        setTimeout(() => showToast("Online"), 500);
    };

    let reconnectDelay = 1000; // 1s initial exponential backoff retry
    socket.onclose = (event) => {
        logDebug("[WARN] WebSocket connection closed.", event.code, event.reason); //1006 on ios typically
        logDebug("Closed. Reconnecting in", reconnectDelay, "ms");
        socket = null;
        setTimeout(initWebSocket, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 1.5, 10000); // max 10s

        setTimeout(() => showToast("Offline"), 300); //show disconnect after delay
    };

    socket.onerror = (err) => {
        logDebug("[ERROR] WebSocket error:", err); //ios gives vague websocket failure
    };

    return socket;
}


/**
 * Cleanly close and destroy the active WebSocket connection, if any.
 *
 * - Removes all event listeners from the socket.
 * - Closes the connection.
 * - Resets the global `socket` reference to `null`.
 *
 * This is useful on iOS Safari or other mobile browsers where
 * backgrounding the tab may cause suspended sockets and stale handlers.
 */
export function destroyWebSocket() {
    if (socket) {
        logDebug("[INFO] Destroying WebSocket connection");
        socket.onopen = socket.onclose = socket.onmessage = socket.onerror = null;
        socket.close();
        socket = null;
    }
}


/**
 * Get the current active WebSocket instance, if any.
 *
 * @returns {WebSocket | null} The active WebSocket, or null if not initialized.
 */
export function getWebSocket() {
    if (!socket) {
        logDebug("[WARN] WebSocket not initialized. Call initWebSocket() first.");
    }
    return socket;
}
