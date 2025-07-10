//static/js/events/search-events.js

import { searchDbTracks, searchFullTracks } from "../api/index.js";
import { renderLibraryList, showLoading, hideLoading } from "../ui/index.js";

//typing triggers recent searches
export async function onSearchInput(e) {
	const q = e.target.value.trim();
	console.log("Search query:", q); // <== should log each time anything is typed

	const tracks = await searchDbTracks(q);
	console.log("Results:", tracks)

	renderLibraryList(results);
}

//enter triggers full search
export async function onSearchEnter(e) {
	if (e.key !== "Enter") return;
	e.preventDefault(); //prevent form submit just in case

	const q = e.target.value.trim();
	console.log("Keypress: ", q)

	if (!q) return;

	try {
		showLoading();
		const tracks = await searchFullTracks(q);
		console.log("Results:", tracks)

		renderLibraryList(tracks);
	} catch (err) {
		console.error("Failed to search for track:", err);
	} finally {
		hideLoading();
	}	
}