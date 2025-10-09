//static/js/features/queue/ui.js

import { 
    buildTrackListItem, 
    buildTrackListEmptyItem, 

    QUEUE_ACTIONS
} from "../../../dom/index.js";


//renders the top element of the queue here
export function renderNowPlaying(titleEl, artistEl, track) {
    if (!track) {
        titleEl.textContent = "---";
        artistEl.textContent = "---";
        return;
    }

    titleEl.textContent = track.title || "Unknown Title";
    artistEl.textContent = track.artist || "Unknown Artist";
}


//renders a list of tracks in the ui
export function renderQueueList(queueListEl, tracks) {
    queueListEl.innerHTML = "";

    if (!Array.isArray(tracks) || !tracks?.length) {
        const item = buildTrackListEmptyItem();
        queueListEl.appendChild(item);
        return;
    }

    //build rows, set their data with their true index values (based on QueueStore), then offset by 0
    tracks.forEach((track, index) => {
        const trueQueueIndex = index + 1;
        const options = {
            showIndex: true,
            index: trueQueueIndex,
            indexOffset: 0,
            actions: QUEUE_ACTIONS
        };
        const item = buildTrackListItem(track, options);
        queueListEl.appendChild(item);
    });
}






