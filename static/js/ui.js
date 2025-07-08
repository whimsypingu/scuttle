import { SELECTORS, $ } from "./dom.js";
import { formatHeader, prepareDataset } from "./parsers.js";

// helper to create element with optional attributes and children
function createElem(tag, attrs = {}, children = []) {
	const el = document.createElement(tag);
	for (const [key, val] of Object.entries(attrs)) {
		if (key === "dataset") {
		Object.entries(val).forEach(([dKey, dVal]) => {
			el.dataset[dKey] = dVal;
		});
		} else if (key === "textContent") {
		el.textContent = val;
		} else {
		el.setAttribute(key, val);
		}
	}
	children.forEach(child => el.appendChild(child));
	return el;
}



//renders a list of tracks in the ui
export function renderTracks(tracks) {
	const libraryHead = $(SELECTORS.ID_LIBRARY_HEAD);
	const libraryBody = $(SELECTORS.ID_LIBRARY_BODY);

	libraryHead.innerHTML = "";
	libraryBody.innerHTML = "";

	if (!tracks || tracks.length === 0) return;

	const headers = Object.keys(tracks[0]);

	//build header row
	const headRow = createElem("tr");
	headers.forEach(field => {
		const th = createElem("th", { textContent: formatHeader(field) });
		headRow.appendChild(th);
	});

	//extra header for play button column and queue button column
	headRow.appendChild(createElem("th", { textContent: "Play" }));
	headRow.appendChild(createElem("th", { textContent: "Queue" }));

	libraryHead.appendChild(headRow);

	//build rows
	tracks.forEach(track => {
		const row = createElem("tr");

		headers.forEach(field => {
		const td = createElem("td", { textContent: track[field] });
		row.appendChild(td);
		});

		//play and queue buttons per track/row
		const trackDataset = prepareDataset(track)

		const playButton = createElem("button", {
			textContent: "Play",
			class: SELECTORS.CLASS_LIBRARY_PLAY_BUTTON,
			dataset: trackDataset,
			type: "button", //good practice for buttons inside forms
    	});
    	const playTd = createElem("td", {}, [playButton]);
    	row.appendChild(playTd);

		const queueButton = createElem("button", {
			textContent: "Queue",
			class: SELECTORS.CLASS_LIBRARY_QUEUE_BUTTON,
			dataset: trackDataset,
			type: "button",
		});
		const queueTd = createElem("td", {}, [queueButton]);
		row.appendChild(queueTd);

    	libraryBody.appendChild(row);
  	});
}

export function showLoading() {
	const spinner = document.getElementById("loading-spinner");
	if (spinner) spinner.style.display = "flex";
}

export function hideLoading() {
	const spinner = document.getElementById("loading-spinner");
	if (spinner) spinner.style.display = "none";
}