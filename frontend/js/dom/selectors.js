//static/js/dom/selectors.js

//shorthand for document.querySelector and querySelectorAll
export function $(id) {
	return document.getElementById(id);
}

//DOM ID constants
export const SELECTORS = {
	search: {
		ids: {
			TITLE_SEARCH_BODY: "title-search",

			SEARCH_BODY: "search",

			INPUT: "search-input",
			SEARCH_GET_RESULTS_BUTTON: "search-get-results-button",
			SEARCH_AND_DOWNLOAD_BUTTON: "search-and-download-button",

			DROPDOWN: "search-dropdown",
			LIST: "search-list"
		},
		classes: {
			SEARCH_BUTTON: "search-button",
		},
	},

	audio: {
		ids: {
			PLAYER: "audio-player",
			TITLE: "now-playing-title",
			ARTIST: "now-playing-artist",

			CURRENT_TIME: "audio-current-time",
			PROGRESS_BAR: "audio-progress-bar",
			DURATION: "audio-duration",

			SHUFFLE_BUTTON: "shuffle-button",
			PREVIOUS_BUTTON: "previous-button",
			PLAY_PAUSE_BUTTON: "play-pause-button",
			NEXT_BUTTON: "next-button",
			LOOP_BUTTON: "loop-button",
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
			ARTIST: "artist",
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
			CLEAR: "clear-queue-button",
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


//const { audioEl, titleEl, artistEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;
export const domEls = {
    //audio and playbar
	audioEl: $(SELECTORS.audio.ids.PLAYER),

    currTimeEl: $(SELECTORS.audio.ids.CURRENT_TIME),
    progBarEl: $(SELECTORS.audio.ids.PROGRESS_BAR),
	durationEl: $(SELECTORS.audio.ids.DURATION),

    ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),

    nextButtonEl: $(SELECTORS.audio.ids.NEXT_BUTTON),
    prevButtonEl: $(SELECTORS.audio.ids.PREVIOUS_BUTTON),

	shuffleButtonEl: $(SELECTORS.audio.ids.SHUFFLE_BUTTON),
	loopButtonEl: $(SELECTORS.audio.ids.LOOP_BUTTON),

    titleEl: $(SELECTORS.audio.ids.TITLE),
    artistEl: $(SELECTORS.audio.ids.ARTIST),

	//queue
	queueListEl: $(SELECTORS.queue.ids.LIST),

	//playlists
	playlistsEl: $(SELECTORS.playlists.ids.BODY),

	libraryListEl: $(SELECTORS.library.ids.LIST),
	likedListEl: $(SELECTORS.liked.ids.LIST),
};


export const queueDomEls = {
	//shuffle button (which is in the audio section but it only affects the queue)
	queueShuffleButtonEl: $(SELECTORS.audio.ids.SHUFFLE_BUTTON),

	//queue
	queueListEl: $(SELECTORS.queue.ids.LIST),

	//clear button
	queueClearButtonEl: $(SELECTORS.queue.ids.CLEAR),
}


export const searchDomEls = {
	titleSearchEl: $(SELECTORS.search.ids.TITLE_SEARCH_BODY),

	searchEl: $(SELECTORS.search.ids.SEARCH_BODY),
	
	searchInputEl: $(SELECTORS.search.ids.INPUT),

	deepSearchButtonEl: $(SELECTORS.search.ids.SEARCH_GET_RESULTS_BUTTON),
	downloadSearchButtonEl: $(SELECTORS.search.ids.SEARCH_AND_DOWNLOAD_BUTTON),

	searchDropdownEl: $(SELECTORS.search.ids.DROPDOWN),
	searchListEl: $(SELECTORS.search.ids.LIST)
};

export const popupDomEls = {
	customPlaylistEl: $(SELECTORS.playlists.ids.CUSTOM),

	createPlaylistButtonEl: $(SELECTORS.playlists.ids.CREATE),

	popupOverlayEl: $(SELECTORS.popup.ids.OVERLAY),
	popupEl: $(SELECTORS.popup.ids.POPUP),
};


export const playlistDomEls = {
	titleSearchEl: $(SELECTORS.search.ids.TITLE_SEARCH_BODY), //for expanding/collapsing playlist

	playlistsEl: $(SELECTORS.playlists.ids.BODY), //container

	customPlaylistEl: $(SELECTORS.playlists.ids.CUSTOM),

	//specific listEls
	searchListEl: $(SELECTORS.search.ids.LIST),

	queueListEl: $(SELECTORS.queue.ids.LIST),

	libraryListEl: $(SELECTORS.library.ids.LIST),
	likedListEl: $(SELECTORS.liked.ids.LIST),
}