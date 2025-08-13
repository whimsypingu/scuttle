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
        renderNowPlaying(null);
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

