//static/js/dom/builder.js

import { SELECTORS } from "./selectors.js";

import { prepareDataset, formatTime } from "../utils/index.js";

//helper to create element with optional attributes and children
export function createElem(tag, attrs = {}, children = []) {
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

export function buildTrackListItem(track) {
    const li = document.createElement("li");
    li.className = "list-track-item";
        
    // Add the track data to the li itself
    const trackDataset = prepareDataset(track);
    Object.entries(trackDataset).forEach(([key, value]) => {
        li.dataset[key] = value;
    });

    const index = 99;
    li.innerHTML = `
        <div class="swipe-action left">
            <i class="fa fa-plus-square"></i>
        </div>

        <div class="foreground">
            <div class="position">
                <p class="position-value">${index}</p>
            </div>
            <div class="info">
                <p class="title">${track.title || "Untitled"}</p>
                <p class="author">${track.uploader || "Unknown artist"}</p>
            </div>
            <div class="duration">
                <p class="duration-value">${formatTime(track.duration)}</p>
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

        <div class="swipe-action right">
            <i class="fa fa-heart"></i>
        </div>
    `;
    return li;
}

export function buildTrackListEmptyItem() {
    const li = document.createElement("li");
    li.className = "list-track-empty-item";
        
    li.innerHTML = `
        <p>No tracks available</p>
    `;
    return li;
}


/*
//helper that makes a track list item
export function buildTrackListItem(track, context) {
    const item = createElem("li", 
        { class: `${SELECTORS.track.classes.ITEM} ${SELECTORS[context].classes.ITEM}` }
    );

    //track fields
    // Title
    const titleDiv = createElem("div", {
        class: `${SELECTORS.track.classes.FIELD} ${SELECTORS[context].classes.FIELD}`,
        textContent: track.title || "Untitled",
    });
    item.appendChild(titleDiv);

    // Uploader
    const uploaderDiv = createElem("div", {
        class: `${SELECTORS.track.classes.FIELD} ${SELECTORS[context].classes.FIELD}`,
        textContent: track.uploader || "Unknown artist",
    });
    item.appendChild(uploaderDiv);

    // Duration (formatted)
    const durationDiv = createElem("div", {
        class: `${SELECTORS.track.classes.FIELD} ${SELECTORS[context].classes.FIELD}`,
        textContent: formatTime(track.duration),
    });
    item.appendChild(durationDiv);


    //action buttons
    const trackDataset = prepareDataset(track);
    const playIcon = createElem("i", { class: "fa fa-play" });
    const playButton = createElem("button", {
        class: SELECTORS.actions.classes.PLAY_BUTTON,
        dataset: {
            ...trackDataset,
            action: "play"
        },
        type: "button",
    }, [playIcon]);

    const queueIcon = createElem("i", { class: "fa fa-plus" });
    const queueButton = createElem("button", {
        class: SELECTORS.actions.classes.QUEUE_BUTTON,
        dataset: {
            ...trackDataset,
            action: "queue"
        },
        type: "button",
    }, [queueIcon]);

    const actions = createElem("div", 
        { class: `${SELECTORS[context].classes.FIELD} ${SELECTORS[context].classes.ACTIONS}` }, 
        [playButton, queueButton]
    );
    item.appendChild(actions);

    return item;
}*/
