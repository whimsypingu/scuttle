import { searchTrack, queueContents } from "./api/index.js";
import { renderLibraryList, renderQueueList } from "./ui/index.js";

import { setupEventListeners, setupWebSocket } from "./setup.js";

async function init() {
	//start websocket connection and listener
	setupWebSocket();


	/*
	try {
		//render library content
		const libraryTrackContent = await searchTrack("");
		renderLibraryList(libraryTrackContent);

		//render default queue content
		const queueTrackContent = await queueContents("default");
		renderQueueList(queueTrackContent);
	} catch (error) {
		console.error("Failed to fetch initial data:", error);
	}
	*/


	//setup ui event listeners
	setupEventListeners();
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
