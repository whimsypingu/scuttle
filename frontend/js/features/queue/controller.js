//static/js/features/queue/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    playCurrentTrack,
    renderNowPlaying
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack,
    renderQueueList
} from "./index.js";



//ui update
export async function renderQueueUI(domEls, tracks) {
    const queueListEl = domEls.queueListEl;

    const titleEl = domEls.titleEl;
    const authorEl = domEls.authorEl;

    if (!Array.isArray(tracks) || tracks.length === 0) {
        renderNowPlaying(titleEl, authorEl, null);
        renderQueueList(queueListEl, null);
        return;
    }

    const currTrack = tracks[0];
    renderNowPlaying(titleEl, authorEl, currTrack);

    const remainingQueue = tracks.slice(1);
    renderQueueList(queueListEl, remainingQueue);
}


//clicking the queue list will check for this
export async function onClickQueueList(e, domEls) {
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
    
    try {
        await queueSetFirstTrack(track);
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

