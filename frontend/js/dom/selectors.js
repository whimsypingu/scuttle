//static/js/dom/selectors.js

//shorthand for document.querySelector and querySelectorAll
export function $(id) {
	return document.getElementById(id);
}

//DOM ID constants
export const SELECTORS = {
	search: {
		ids: {
			BODY: "title-search",

			INPUT: "search-input",
			SEARCH_GET_RESULTS_BUTTON: "search-get-results-button",
			SEARCH_AND_DOWNLOAD_BUTTON: "search-and-download-button",

			DROPDOWN: "search-dropdown"
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

	popup: {
		ids: {
			OVERLAY: "popup-overlay",
			POPUP: "popup",
		},
		classes: {
			//
		},
	},

	spinner: {
		ids: {
			SPINNER: "spinner",
		},
		classes: {
			//
		},
	},

	playlists: {
		ids: {
			BODY: "playlists",

			LIBRARY: "library",
			LIKED: "liked",

			CUSTOM: "custom-playlists",

			CREATE: "create-playlist-button",
		},
		classes: {
			PLAYLIST: "playlist",

			HEADER: "list-header",
		}
	},

	library: {
		ids: {
			LIST: "library-list",
		},
	},

	liked: {
		ids: {
			LIST: "liked-list",
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


//const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;
export const domEls = {
    //audio and playbar
	audioEl: $(SELECTORS.audio.ids.PLAYER),

    currTimeEl: $(SELECTORS.audio.ids.CURRENT_TIME),
    progBarEl: $(SELECTORS.audio.ids.PROGRESS_BAR),
	durationEl: $(SELECTORS.audio.ids.DURATION),

    ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),

    nextButtonEl: $(SELECTORS.audio.ids.NEXT_BUTTON),
    prevButtonEl: $(SELECTORS.audio.ids.PREVIOUS_BUTTON),

    titleEl: $(SELECTORS.audio.ids.TITLE),
    authorEl: $(SELECTORS.audio.ids.AUTHOR),

	//queue
	queueListEl: $(SELECTORS.queue.ids.LIST),

	//playlists
	playlistsEl: $(SELECTORS.playlists.ids.BODY),

	libraryListEl: $(SELECTORS.library.ids.LIST),
	likedListEl: $(SELECTORS.liked.ids.LIST),
};


export const searchDomEls = {
	titleSearchEl: $(SELECTORS.search.ids.BODY),
	
	searchInputEl: $(SELECTORS.search.ids.INPUT),

	deepSearchButtonEl: $(SELECTORS.search.ids.SEARCH_GET_RESULTS_BUTTON),
	downloadSearchButtonEl: $(SELECTORS.search.ids.SEARCH_AND_DOWNLOAD_BUTTON),

	searchDropdownEl: $(SELECTORS.search.ids.DROPDOWN)
};

export const popupDomEls = {
	customPlaylistEl: $(SELECTORS.playlists.ids.CUSTOM),

	createPlaylistButtonEl: $(SELECTORS.playlists.ids.CREATE),

	popupOverlayEl: $(SELECTORS.popup.ids.OVERLAY),
	popupEl: $(SELECTORS.popup.ids.POPUP),
};


export const playlistDomEls = {
	customPlaylistEl: $(SELECTORS.playlists.ids.CUSTOM),


}