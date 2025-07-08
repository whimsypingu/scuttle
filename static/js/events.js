import { SELECTORS, $ } from "./dom.js";
import { searchDbTracks, searchFullTracks, downloadTrack, playTrack } from "./api.js";
import { renderTracks, showLoading, hideLoading } from "./ui.js";
import { debounce } from "./debounce.js";
import { parseTrackFromDataset } from "./parsers.js"

//typing triggers recent searches
async function onSearchInput(e) {
	const q = e.target.value.trim();
	console.log("Search query:", q); // <== should log each time anything is typed

	const results = await searchDbTracks(q);
	console.log("Results:", results)

	renderTracks(results);
}

//enter triggers full search
async function onSearchEnter(e) {
	if (e.key !== "Enter") return;
	e.preventDefault(); //prevent form submit just in case

	const q = e.target.value.trim();
	console.log("Keypress: ", q)

	if (!q) return;

	try {
		showLoading();
		const results = await searchFullTracks(q);
		renderTracks(results);
	} catch (err) {
		console.error("Failed to search for track:", err);
	} finally {
		hideLoading();
	}	
}

async function onClickLibraryPlayButton(track) {
	try {
		showLoading();
		const res = await downloadTrack(track);
		console.log("Download status:", res.status);

		playTrack(track)
	} catch (err) {
		console.error("Failed to download or play track:", err);
	} finally {
		hideLoading();
	}
}

async function onClickLibraryQueueButton(track) {
	
}

async function onClickLibraryBody(e) {
	if (e.target.tagName !== "BUTTON") return;

	const track = parseTrackFromDataset(e.target.dataset);
	if (!track) {
		console.error("Missing track data attributes in dataset");
		return;
	}

	if (e.target.classList.contains(SELECTORS.CLASS_LIBRARY_PLAY_BUTTON)) {
		await onClickLibraryPlayButton(track);
	} else if (e.target.classList.contains(SELECTORS.CLASS_LIBRARY_QUEUE_BUTTON)) {
		await onClickLibraryQueueButton(track);
	}
}


export function setupEventListeners() {

	//typing triggers dropdown
	$(SELECTORS.ID_SEARCH_INPUT).addEventListener("input", debounce(onSearchInput, 300));

	//enter triggers full search
	$(SELECTORS.ID_SEARCH_INPUT).addEventListener("keydown", onSearchEnter);

	//button click delegation on the table body
	$(SELECTORS.ID_LIBRARY_BODY).addEventListener("click", onClickLibraryBody);
}
