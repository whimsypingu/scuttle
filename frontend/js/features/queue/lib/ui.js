//static/js/features/queue/ui.js

import { buildTrackListItem, buildTrackListEmptyItem } from "../../../dom/index.js";


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

    //build rows
    tracks.forEach((track, index) => {
        const item = buildTrackListItem(track, index);
        queueListEl.appendChild(item);
    });
}






