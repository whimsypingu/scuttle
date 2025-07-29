//static/js/features/library/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    playCurrentTrack 
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack
} from "../queue/index.js";


//clicking the library list will check for this
export async function onClickLibraryList(e, domEls) {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;
 
    switch (action) {
        case "play":
            await onClickPlayButton(button, domEls);
            break;
        case "queue":
            await onClickQueueButton(button);
            break;
    }
}


//helpers
async function onClickPlayButton(button, domEls) {
    const audioEl = domEls.audioEl;
    const ppButtonEl = domEls.ppButtonEl;
    const durationEl = domEls.durationEl;

    console.log("")

    const track = parseTrackFromDataset(button.dataset);
    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }
    
    try {
        await queueSetFirstTrack(track);
        await playCurrentTrack(audioEl, durationEl, ppButtonEl);
    } catch (err) {
        console.error("Failed to play audio:", err);
    }
}

async function onClickQueueButton(button) {
    const track = parseTrackFromDataset(button.dataset);
    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }

    try {
        await queuePushTrack(track);
    } catch (err) {
        console.error("Failed to queue audio:", err);
    }
}

