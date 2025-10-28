import { bootstrapAll } from "./bootstrap/bootstrap.js";
import { hideBootLoadingOverlay } from "./bootstrap/loadingScreen.js";

import { setupAudioEventListeners } from "./dom/audio.js";
import { setupPlaylistEventListeners } from "./dom/playlists.js";
import { setupQueueEventListeners } from "./dom/queue.js";
import { setupSearchEventListeners } from "./dom/search.js";
import { setupToggle } from "./dom/toggle.js";

import { setupWebSocket } from "./websocket/websocket.js";

import { registerMediaSessionHandlers } from "./platform/mediaSession.js";

import { setLayoutDesktop, setLayoutMobile } from "./mobile/setMobile.js";

import { isMobile } from "../utils/index.js"; 
import { logDebug } from "../utils/debug.js";
import { setupPopupListeners } from "./dom/popup.js";
import { setupRefocus } from "./bootstrap/focusApp.js";


async function setupDomEvents() {
    setupAudioEventListeners();

    setupPlaylistEventListeners();
    setupPopupListeners();

    setupQueueEventListeners();
    setupSearchEventListeners();
    setupToggle();
}

async function setupWebsocketEvents() {
    setupWebSocket();
}

async function setupMobileEvents() {
    if (isMobile()) {
        logDebug("MOBILE ACTIVE");

        setLayoutMobile();
        setupRefocus();

        const { setupSwipeEventListeners } = await import("./mobile/swipe.js");
        setupSwipeEventListeners();

        const { setupReorderEventListeners } = await import("./mobile/reorder.js");
        setupReorderEventListeners();
    } else {
        logDebug("DESKTOP ACTIVE");
        
        setLayoutDesktop();
    }
}

function setupPlatformEvents() {
    registerMediaSessionHandlers();
}

export async function initEvents() {
    await bootstrapAll();
    await setupDomEvents();
    await setupWebsocketEvents();
    await setupMobileEvents();
    setupPlatformEvents();
    hideBootLoadingOverlay();
    logDebug("INIT EVENTS");
}
