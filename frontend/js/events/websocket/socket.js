//static/js/websocket/socket.js

let socket = null;

const reconnectTimeout = 3000; //ms

export function initWebSocket() {

    //websocket failure ciould be that you have to pip install "uvicorn[standard]" for websocket support

    if (socket) {
        console.warn("WebSocket already initialized");
        return socket;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"; //use wss if https, otherwise ws for http
    const host = window.location.host; // includes hostname + port
    const webSocketUrl = `${protocol}://${host}/websocket`;

    socket = new WebSocket(webSocketUrl); //ex. "ws://localhost:8000/websocket");

    socket.onopen = () => {
        console.log("WebSocket connection established.");
    };

    socket.onclose = () => {
        console.warn("WebSocket connection closed.");
        socket = null;
        setTimeout(initWebSocket, reconnectTimeout);
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    return socket;
}


export function getWebSocket() {
    if (!socket) {
        console.warn("WebSocket not initialized. Call initWebSocket() first.");
    }
    return socket;
}
