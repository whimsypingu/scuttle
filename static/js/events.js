import { DOM_IDS, $ } from './dom.js';
import { searchDbTracks, searchFullTracks, downloadTrack, playTrack } from './api.js';
import { renderTracks, showLoading, hideLoading } from './ui.js';
import { debounce } from './debounce.js';

export function setupEventListeners() {
	//search input debounced live search
	$(DOM_IDS.SEARCH_INPUT).addEventListener("input", debounce(async (e) => {
		const q = e.target.value.trim();
		console.log("Search query:", q); // <== should log each time anything is typed

		const results = await searchDbTracks(q);
		console.log("Results:", results)

		renderTracks(results);
	}, 300));


	//pressing enter in the search input triggers full search
	$(DOM_IDS.SEARCH_INPUT).addEventListener("keydown", async (e) => {
		if (e.key === "Enter") {
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
	});


	//play button click delegation on the table body
	document.getElementById("table-body").addEventListener("click", async (e) => {
		if (e.target.tagName === "BUTTON") {
			const youtubeId = e.target.dataset.youtubeId;
			const title = e.target.dataset.title;
			const uploader = e.target.dataset.uploader;
			const duration = parseInt(e.target.dataset.duration);

			if (!youtubeId || !title || !uploader || !duration) {
				console.error("Missing track data attributes");
				return;
			}

			const track = {
				youtube_id: youtubeId,
				title: title,
				uploader: uploader,
				duration: duration,
			};

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
	});




	//-------------
	/*
	//search button click adds in yt search results
	document.getElementById("searchBtn").addEventListener("click", async () => {
		const q = document.getElementById("searchInput").value.trim();

		if (!q) return;
		const results = await searchFullTracks(q);
		renderTracks(results);
	});



	//explicit play button for manual YouTube ID input
	document.getElementById("playBtn").addEventListener("click", () => {
		const youtubeId = document.getElementById("youtubeId").value.trim();
		if (!youtubeId) {
			alert("Please enter a YouTube ID");
			return;
		}
		playTrackById(youtubeId);
	});
	*/
}
