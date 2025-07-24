//static/js/events/websocket/websocket-events.js

import { renderQueueList } from "../../../features/queue/index.js";


//handles websocket messages
export function handleWebSocketMessage(message) {

    //defense
    if (!message || typeof message.context !== "string") {
        console.warn("Invalid WebSocket message format:", message);
        return;
    }

    //debug
    console.log("WebSocket message received:", message);

    //handler logic
    const context = message.context;
    const data = message.data;

    const handlers = { 
        "play_queue.track_added": handlePlayQueueOnAdd,
        "play_queue.track_removed": handlePlayQueueOnRemove
    }; //now source+action

    const handler = handlers[context];
    if (handler) {
        handler(data);
    } else {
        console.warn("Unhandled Websocket context:", context);
    }
}

function handlePlayQueueOnAdd(data) {
    renderQueueList(data.content);
    return;
}


function handlePlayQueueOnRemove(data) {
    renderQueueList(data.content);
    return;
}


