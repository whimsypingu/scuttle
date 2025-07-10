import { searchDbTracks, getQueue } from "./api/music-api.js";
import { renderLibraryList } from "./ui/library-ui.js";
import { renderQueueList } from "./ui/queue-ui.js";

import { setupEventListeners } from "./setup.js";

async function init() {
	const libraryTracks = await searchDbTracks("");
	renderLibraryList(libraryTracks);

	const queueTracks = await getQueue("default");
	renderQueueList(queueTracks);

	setupEventListeners();
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
