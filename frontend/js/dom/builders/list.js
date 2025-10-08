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


export const MINIMAL_ACTIONS = Object.freeze({
    right: {
        name: "queue",
        icon: "fa fa-plus-square"
    },
    left: {
        name: "like",
        icon: "fa fa-heart"
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
 * @param {number} [options.index] - Position in playlist (if specified, will display index number). Defaults to nothing
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
 *         index: 0,
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
        index = null,
        actions = queueActions,
    } = options;

    const li = document.createElement("li");
    li.classList.add("list-track-item");

    //store track id
    li.dataset.trackId = track.id;

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
    const positionArea = index != null ? `
        <div class="position">
            <a class="no-link" href="#">
                <p class="position-value">${(index) + 1}</p>
            </a>
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
