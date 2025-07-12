//static/js/events/rest/library-events.js

import { $, SELECTORS } from "../../dom/index.js";
import { playTrack, queueTrack } from "../../api/index.js";
import { showLoading, hideLoading, renderQueueList } from "../../ui/index.js";
import { parseTrackFromDataset } from "../../utils/index.js"

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
        const { queueTrackContent: queueTrackContent } = await queueTrack(track, true);
        //renderQueueList(queueTrackContent);

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


async function onClickLibraryQueueButton(track) {
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
