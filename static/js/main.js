import { setupAudioEventListeners } from "./events/dom/audio.js";
import { setupLibraryEventListeners } from "./events/dom/library.js";
import { setupQueueEventListeners } from "./events/dom/queue.js";
import { setupWebSocket } from "./events/websocket/websocket.js";

import { bootstrapAll } from "./events/bootstrap/bootstrap.js";

async function init() {
	setupAudioEventListeners();
	setupLibraryEventListeners();
	setupQueueEventListeners();
	setupWebSocket();

	bootstrapAll();
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
