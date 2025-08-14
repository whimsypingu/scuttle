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
    //check button clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    if (button) {
        if (button.classList.contains("queue-button")) {
            console.log("queued", li?.dataset);

            await onClickQueueButton(dataset);
        } else if (button.classList.contains("more-button")) {
            console.log("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        console.log("list item clicked:", li.dataset)

        await onClickPlayButton(domEls, dataset);
    }
}


//helpers
async function onClickPlayButton(domEls, dataset) {
    const audioEl = domEls.audioEl;
    const ppButtonEl = domEls.ppButtonEl;
    const durationEl = domEls.durationEl;

    const track = parseTrackFromDataset(dataset);
    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }
    

    queueSetFirstTrack(track).catch(err => console.error("Queue error:", err));
    try {
        await playCurrentTrack(audioEl, durationEl, ppButtonEl);
    } catch (err) {
        console.error("Failed to play audio:", err);
    }
}

async function onClickQueueButton(dataset) {
    const track = parseTrackFromDataset(dataset);
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

