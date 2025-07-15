//static/js/events/rest/queue-events.js

import { $, SELECTORS } from "../../dom/index.js";
import { playTrack, queueTrack, queueNowTrack } from "../../api/index.js";
import { showLoading, hideLoading } from "../../ui/index.js";
import { parseTrackFromDataset } from "../../utils/index.js"
import { setAndPlayBlob } from "../../core/audio-player.js";

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
        await queueNowTrack(track);

        const blob = await playTrack();
        const audioElement = $(SELECTORS.audio.ids.PLAYER);

        await setAndPlayBlob(audioElement, blob);
    } catch (err) {
        console.error("Failed to play track:", err);
    } finally {
        hideLoading();
    }
}


async function onClickQueueButton(track) {
    try {
        showLoading();
        await queueTrack(track);
    } catch (err) {
        console.error("Failed to queue track:", err);
    } finally {
        hideLoading();
    }
}

