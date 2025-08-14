//static/js/dom/selectors.js

//shorthand for document.querySelector and querySelectorAll
export function $(id) {
	return document.getElementById(id);
}

//DOM ID constants
export const SELECTORS = {
	search: {
		ids: {
			INPUT: "search-input",
			SEARCH_GET_RESULTS_BUTTON: "search-get-results-button",
			SEARCH_AND_DOWNLOAD_BUTTON: "search-and-download-button",
		},
		classes: {
			SEARCH_BUTTON: "search-button",
		},
	},

	audio: {
		ids: {
			PLAYER: "audio-player",
			TITLE: "now-playing-title",
			AUTHOR: "now-playing-author",

			CURRENT_TIME: "audio-current-time",
			PROGRESS_BAR: "audio-progress-bar",
			DURATION: "audio-duration",

			PREVIOUS_BUTTON: "previous-button",
			PLAY_PAUSE_BUTTON: "play-pause-button",
			NEXT_BUTTON: "next-button",
		},
		classes: {
			//
		},
	},

	track: {
		ids: {
			//
		},
		classes: {
			ITEM: "list-track-item",

			LEFT: "left",
			RIGHT: "right",

			FOREGROUND: "foreground",
			POSITION: "position-value",
			TITLE: "title",
			AUTHOR: "author",
			DURATION: "duration-value",
		},
	},

	library: {
		ids: {
			NAME: "library-name",
			LIST: "library-list",
		},
		classes: {
			//?
			ITEM: "library-item",
			FIELD: "library-field",
			ACTIONS: "library-actions",
		},
	},

	queue: {
		ids: {
			NAME: "queue-name",
			LIST: "queue-list",
		},
		classes: {
			//?
			ITEM: "queue-item",
			FIELD: "queue-field",
			ACTIONS: "queue-actions",
		},
	},

	//?
	actions: {
		ids: {
			//
		},
		classes: {
			PLAY_BUTTON: "play-button",
			QUEUE_BUTTON: "queue-button",
		}
	}
};
