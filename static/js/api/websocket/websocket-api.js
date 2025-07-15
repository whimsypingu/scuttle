//static/js/api/websocket/websocket-api.js

let socket = null;

//sets up websocket
export function initWebSocket() {
    if (socket) {
        console.warn("WebSocket already initialized");
        return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"; //use wss if https, otherwise ws for http
    const host = window.location.host; // includes hostname + port
    const webSocketUrl = `${protocol}://${host}/websocket`;

    socket = new WebSocket(webSocketUrl); //"ws://localhost:8000/websocket");

    socket.onopen = () => {
        console.log("WebSocket connection established.");
    };

    socket.onclose = () => {
        console.warn("WebSocket connection closed.");
        socket = null;
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    return socket;
}
