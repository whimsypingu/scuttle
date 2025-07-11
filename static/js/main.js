import { searchTrack, queueContents } from "./api/index.js";
import { renderLibraryList, renderQueueList } from "./ui/index.js";

import { setupEventListeners } from "./setup.js";

async function init() {
	const libraryTrackContent = await searchTrack("");
	renderLibraryList(libraryTrackContent);

	const queueTrackContent = await queueContents("default");
	renderQueueList(queueTrackContent);

	setupEventListeners();
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
