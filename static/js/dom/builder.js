//static/js/dom/builder.js

import { SELECTORS } from "./selectors.js";

import { prepareDataset } from "../utils/index.js";

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

//helper that makes a track list item
export function buildTrackListItem(track, context) {
    const item = createElem("li", 
        { class: `${SELECTORS.track.classes.ITEM} ${SELECTORS[context].classes.ITEM}` }
    );

    //track fields
    const fieldsToShow = ["title", "uploader", "duration"];
    fieldsToShow.forEach(field => {
        const div = createElem("div", {
            class: `${SELECTORS.track.classes.FIELD} ${SELECTORS[context].classes.FIELD}`,
            textContent: track[field],
        });
        item.appendChild(div);
    });

    //action buttons
    const trackDataset = prepareDataset(track);
    const playButton = createElem("button", {
        textContent: "Play",
        class: SELECTORS.actions.classes.PLAY_BUTTON,
        dataset: trackDataset,
        type: "button",
    });

    const queueButton = createElem("button", {
        textContent: "Queue",
        class: SELECTORS.actions.classes.QUEUE_BUTTON,
        dataset: trackDataset,
        type: "button",
    });

    const actions = createElem("div", 
        { class: `${SELECTORS[context].classes.FIELD} ${SELECTORS[context].classes.ACTIONS}` }, 
        [playButton, queueButton]
    );
    item.appendChild(actions);

    return item;
}
