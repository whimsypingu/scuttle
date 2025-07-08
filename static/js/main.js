import { searchDbTracks } from "./api.js";
import { renderTracks } from "./ui.js";
import { setupEventListeners } from "./events.js";

async function init() {
	setupEventListeners();
	const tracks = await searchDbTracks("");
	renderTracks(tracks);
}

window.addEventListener("DOMContentLoaded", () => {
	init();
});
