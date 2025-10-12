import { formatTime } from "../../utils/index.js";

/**
 * Default actions set — used if none is provided.
 * This represents the full 4-action layout.
 */
export const DEFAULT_ACTIONS = Object.freeze({
    right: {
        name: "queue",
        icon: "fa fa-plus-square"
    },
    rightDeep: {
        name: "queueFirst",
        icon: "fa fa-plus-circle"
    },
    left: {
        name: "like",
        icon: "fa fa-heart"
    },
    leftDeep: {
        name: "more",
        icon: "fa fa-ellipsis-h"
    }
});


export const SEARCH_ACTIONS = Object.freeze({
    right: {
        name: "queue",
        icon: "fa fa-plus-square"
    },
    rightDeep: {
        name: "queueFirst",
        icon: "fa fa-plus-circle"
    },
    left: {
        name: "download",
        icon: "fa fa-cloud-download"
    }
});

export const QUEUE_ACTIONS = Object.freeze({
    right: {
        name: "queue",
        icon: "fa fa-plus-square"
    },
    rightDeep: {
        name: "queueFirst",
        icon: "fa fa-plus-circle",
    },
    left: {
        name: "remove",
        icon: "fa fa-trash"
    }
});

/**
 * Build a customizable `<li>` track list item with flexible swipe and action configurations.
 *
 * Each list item can include:
 * - Optional numeric index (position in playlist)
 * - Track info: title, artist, duration
 * - Foreground with swipe-action areas on left and right
 * - Dataset attributes for swipe actions to allow dynamic handling
 *
 * @param {Object} track - Track data object.
 * @param {string|number} track.id - Unique track identifier.
 * @param {string} [track.title] - Track title (defaults to "Untitled").
 * @param {string} [track.artist] - Track artist (defaults to "Unknown artist").
 * @param {number} [track.duration] - Track duration in seconds.
 *
 * @param {Object} [options] - Optional customization.
 * @param {boolean} [options.showIndex=false] - Whether to show the index or not
 * @param {number} [options.index=-1] - Position in playlist (if specified, will display index number). Defaults to invalid -1
 * @param {number} [options.indexOffset=1] - Offset to the position to visibly show (ex. position is 0 in the PlaylistStore, so shows as track 1)
 * @param {boolean} [options.showDownloadStatus=false] - Whether to show the download status area.
 * @param {boolean} [options.isDownloaded=false] - Whether the track is already downloaded (controls the icon).
 *        Note: The download icon is only shown if `showDownloadStatus` is true and `isDownloaded` is false.
 * @param {Object} [options.actions] - Swipe actions configuration (defaults to `queueActions`).
 * @param {Object} [options.actions.left] - Left swipe action (primary). Object with `name` and `icon`.
 * @param {Object} [options.actions.leftDeep] - Left swipe deep action (secondary). Object with `name` and `icon`.
 * @param {Object} [options.actions.right] - Right swipe action (primary). Object with `name` and `icon`.
 * @param {Object} [options.actions.rightDeep] - Right swipe deep action (secondary). Object with `name` and `icon`.
 *
 * @returns {HTMLLIElement} A fully built `<li>` DOM element ready to be inserted into a track list.
 *
 * @example
 * const trackItem = buildTrackListItem(
 *     { id: "abc123", title: "Song Title", artist: "Artist Name", duration: 245 },
 *     { 
 *         showIndex: true,
 *         index: 0,
 *         indexOffset: 1,
 * 
 *         showDownloadStatus: true,
 *         isDownloaded: false,
 * 
 *         actions: {
 *             left: { name: "queue", icon: "fa fa-plus-square" },
 *             leftDeep: { name: "queueFirst", icon: "fa fa-plus-circle" },
 *             right: { name: "like", icon: "fa fa-heart" },
 *             rightDeep: { name: "more", icon: "fa fa-ellipsis-h" }
 *         }
 *     }
 * );
 */
export function buildTrackListItem(track, options = {}) {
    const {
        showIndex = false,
        index = -1,
        indexOffset = 1, //offset the shown text 
        
        showDownloadStatus = false,
        isDownloaded = true, //downloaded or not

        actions = DEFAULT_ACTIONS,
    } = options;

    const li = document.createElement("li");
    li.classList.add("list-track-item");

    //store track id and index if available
    li.dataset.trackId = track.id;
    li.dataset.index = index;
    li.dataset.isDownloaded = isDownloaded;

    //store action names in dataset (if present)
    for (const pos of ["right", "rightDeep", "left", "leftDeep"]) {
        if (actions[pos]) {
            li.dataset[pos] = actions[pos].name
        }
    }

    //separate swipe actions by position, this is done by swipe direction and not side of reveal
    const rightSwipeArea = actions.right ? `
        <div class="swipe-action right">
            <i class="${actions.right.icon}"></i>
        </div>
    ` : "";
    const leftSwipeArea = actions.left ? `
        <div class="swipe-action left">
            <i class="${actions.left.icon}"></i>
        </div>
    ` : "";

    //build the index if needed
    const positionArea = showIndex ? `
        <div class="position">
            <a class="no-link" href="#">
                <p class="position-value">${index + indexOffset}</p>
            </a>
        </div>
    ` : "";

    //build the downloaded area if needed
    const downloadedArea = showDownloadStatus ? `
        <div class="download-status">
            ${!isDownloaded ? `<i class="fa fa-cloud-download"></i>` : ""}
        </div>
    ` : "";
    
    //jesus apple is so FUCKING cringe for putting auto detect links and phone numbers
    li.innerHTML = `
        ${rightSwipeArea}

        <div class="foreground">
            ${positionArea}

            <div class="info">
                <p class="title">${track.title || "Untitled"}</p>
                <p class="artist">${track.artist || "Unknown artist"}</p>
            </div>

            ${downloadedArea}

            <div class="duration">
                <p class="duration-value">${formatTime(track.duration, false)}</p>
            </div>
        </div>

        <div class="actions">
            <button class="queue-button normal-button">
                <i class="fa fa-plus-square"></i>
            </button>
            <button class="more-button normal-button">
                <i class="fa fa-cog"></i>
            </button>
        </div>

        ${leftSwipeArea}
    `;
    return li;
}

export function buildTrackListEmptyItem() {
    const li = document.createElement("li");
    li.classList.add("list-track-empty-item");
        
    li.innerHTML = `
        <p>No tracks available</p>
    `;
    return li;
}





export function buildNewPlaylist(name, id) {
    const playlist = document.createElement("div");
    playlist.classList.add("playlist");

    playlist.dataset.name = name;
    playlist.dataset.id = id;

    playlist.innerHTML = `
        <div class="list-header">
            <h3 class="list-title">${name}</h3>
        </div>

        <div class="playlist-options">
            <button class="playlist-option-button edit-playlist-button">
                <i class="fa fa-ellipsis-h"></i>
            </button>

            <button class="playlist-option-button shuffle-playlist-button">
                <i class="fa fa-random"></i>
            </button>

            <button class="playlist-option-button play-playlist-button">
                <i class="fa fa-play"></i>
            </button>
        </div>

        <ul class="list-track">
        </ul>
    `;

    return playlist;
}