//static/js/events/queue-events.js

import { $, SELECTORS } from "../dom/index.js";
import { playTrack, queueTrack } from "../api/index.js";
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
        const { queueTrackContent: queueTrackContent } = await queueTrack(track, true);
        renderQueueList(queueTrackContent);

        const blob = await playTrack();
        const url = URL.createObjectURL(blob);

        const audioElement = $(SELECTORS.audio.ids.PLAYER);
        //stop memory leaks
        if (audioElement.src.startsWith("blob:")) {
            URL.revokeObjectURL(audioElement.src);
        }

        audioElement.src = url;
        audioElement.play();

    } catch (err) {
        console.error("Failed to play track:", err);
    } finally {
        hideLoading();
    }
}


async function onClickQueueButton(track) {
    try {
        showLoading();
        const { queueTrackContent: queueTrackContent } = await queueTrack(track);
        renderQueueList(queueTrackContent);
    } catch (err) {
        console.error("Failed to queue track:", err);
    } finally {
        hideLoading();
    }
}

