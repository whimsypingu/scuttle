//static/js/dom.js

//shorthand for document.querySelector and querySelectorAll
export function $(id) {
	return document.getElementById(id);
}

//DOM ID constants
export const SELECTORS = {
	ID_SEARCH_INPUT: "search-input",
	ID_SEARCH_AND_DOWNLOAD_BUTTON: "search-and-download-button",

	ID_LIBRARY_HEAD: "library-head",
	ID_LIBRARY_BODY: "library-body",

	ID_AUDIO_PLAYER: "audio-player",

	CLASS_LIBRARY_PLAY_BUTTON: "play-button",
	CLASS_LIBRARY_QUEUE_BUTTON: "queue-button",
}
