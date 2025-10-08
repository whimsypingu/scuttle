import { formatTime } from "../../utils/index.js";

/**
 * Default actions set — used if none is provided.
 * This represents the full 4-action layout.
 */
export const defaultActions = {
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
};


export const minimalActions = {
    right: {
        name: "queue",
        icon: "fa fa-plus-square"
    },
    left: {
        name: "like",
        icon: "fa fa-heart"
    }
};

export const queueActions = {
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
}

/**
 * Build a customizable <li> track list item with flexible swipe and action configurations.
 *
 *
 * @returns {HTMLLIElement} A fully built <li> DOM node.
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
