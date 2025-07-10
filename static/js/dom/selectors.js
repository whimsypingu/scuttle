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
			SEARCH_AND_DOWNLOAD_BUTTON: "search-and-download-button",
		},
		classes: {
			//
		},
	},

	audio: {
		ids: {
			PLAYER: "audio-player",
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
			ITEM: "track-item",
			FIELD: "track-field",
		},
	},

	library: {
		ids: {
			LIST: "library-list",
		},
		classes: {
			ITEM: "library-item",
			FIELD: "library-field",
			ACTIONS: "library-actions",
		},
	},

	queue: {
		ids: {
			LIST: "queue-list",
		},
		classes: {
			ITEM: "queue-item",
			FIELD: "queue-field",
			ACTIONS: "queue-actions",
		},
	},

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
