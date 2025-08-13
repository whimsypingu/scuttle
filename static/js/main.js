import { 
	setupAudioEventListeners,
	setupLibraryEventListeners,
	setupQueueEventListeners,
	setupSearchEventListeners
} from "./events/index.js";

import { setupWebSocket } from "./events/websocket/websocket.js";

import { bootstrapAll } from "./events/bootstrap/bootstrap.js";

async function init() {
	setupAudioEventListeners();
	setupLibraryEventListeners();
	setupQueueEventListeners();
	setupSearchEventListeners();

	setupWebSocket();

	bootstrapAll();
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
