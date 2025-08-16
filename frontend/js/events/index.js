import { bootstrapLibrary, bootstrapQueue } from "./bootstrap/bootstrap.js";

import { setupAudioEventListeners } from "./dom/audio.js";
import { setupLibraryEventListeners } from "./dom/library.js";
import { setupQueueEventListeners } from "./dom/queue.js";
import { setupSearchEventListeners } from "./dom/search.js";
import { setupToggle } from "./dom/toggle.js";

import { setupWebSocket } from "./websocket/websocket.js";

import { isMobile } from "../utils/index.js"; 


async function bootstrapAll() {
    bootstrapLibrary();
    bootstrapQueue();
}


async function setupDomEvents() {
    setupAudioEventListeners();
    setupLibraryEventListeners();
    setupQueueEventListeners();
    setupSearchEventListeners();
    setupToggle();
}

async function setupWebsocketEvents() {
    setupWebSocket();
}

import { logDebug } from "../utils/debug.js";
async function setupMobileEvents() {
    if (isMobile()) {
        logDebug("MOBILE ACTIVE");

        const { setupSwipeEventListeners } = await import("./mobile/swipe.js");
        setupSwipeEventListeners();
    }
}

export async function initEvents() {
    await bootstrapAll();
    await setupDomEvents();
    await setupWebsocketEvents();
    await setupMobileEvents();
    logDebug("INIT EVENTS");
}
