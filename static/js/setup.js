// static/js/setup.js

import { SELECTORS, $ } from "./dom/index.js";
import { debounce } from "./utils/index.js";
import { onSearchInput, onSearchEnter, onClickLibraryList, onClickQueueList } from "./events/index.js";
import { initWebSocket } from "./api/websocket/websocket-api.js";


//sets up all events
export function setupEventListeners() {

    //search
    $(SELECTORS.search.ids.INPUT).addEventListener("input", debounce(onSearchInput, 300));
    $(SELECTORS.search.ids.INPUT).addEventListener("keydown", onSearchEnter);

    //library
    $(SELECTORS.library.ids.LIST).addEventListener("click", onClickLibraryList);

    //queue
    $(SELECTORS.queue.ids.LIST).addEventListener("click", onClickQueueList);
}

//sets up websocket
export function setupWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"; //use wss if https, otherwise ws for http
    const host = window.location.host; // includes hostname + port
    const webSocketUrl = `${protocol}://${host}/websocket`;

    initWebSocket(webSocketUrl);
}
