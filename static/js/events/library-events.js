//static/js/events/library-events.js

import { SELECTORS } from "../dom/index.js";
import { downloadTrack, playTrack, queueTrack, getQueue } from "../api/index.js";
import { showLoading, hideLoading, renderQueueList } from "../ui/index.js";
import { parseTrackFromDataset } from "../utils/index.js"

//clicking the library list will check for this
export async function onClickLibraryList(e) {
    if (e.target.tagName !== "BUTTON") return;

    const track = parseTrackFromDataset(e.target.dataset);
    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }

    if (e.target.classList.contains(SELECTORS.actions.classes.PLAY_BUTTON)) {
        await onClickLibraryPlayButton(track);
    } else if (e.target.classList.contains(SELECTORS.actions.classes.QUEUE_BUTTON)) {
        await onClickLibraryQueueButton(track);
    }
}

async function onClickLibraryPlayButton(track) {
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

async function onClickLibraryQueueButton(track) {
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
