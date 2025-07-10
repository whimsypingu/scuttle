//static/js/events/queue-events.js

import { SELECTORS } from "../dom/index.js";
import { downloadTrack, playTrack, queueTrack, getQueue } from "../api/index.js";
import { renderQueueList, showLoading, hideLoading } from "../ui/index.js";
import { parseTrackFromDataset } from "../utils/index.js"

//clicking the queue list will check for this
export async function onClickQueueList(e) {
    if (e.target.tagName !== "BUTTON") return;

    const track = parseTrackFromDataset(e.target.dataset);
    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }
  
    if (e.target.classList.contains(SELECTORS.actions.classes.PLAY_BUTTON)) {
        await onClickPlayButton(track);
    } else if (e.target.classList.contains(SELECTORS.actions.classes.QUEUE_BUTTON)) {
        await onClickQueueButton(track);
    }
}

async function onClickPlayButton(track) {
    try {
        showLoading();
        const res = await downloadTrack(track);
        
        playTrack(track)
    } catch (err) {
        console.error("Failed to download or play track:", err);
    } finally {
        hideLoading();
    }
}



const DEFAULT_QUEUE = "default";

async function onClickQueueButton(track) {
    try {
        showLoading();
        const res = await queueTrack(track, DEFAULT_QUEUE);

        const tracks = await getQueue(DEFAULT_QUEUE);

        renderQueueList(tracks);
    } catch (err) {
        console.error("Failed to queue track:", err);
    } finally {
        hideLoading();
    }
}

