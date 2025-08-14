//static/js/features/queue/ui.js

import { buildTrackListItem, buildTrackListEmptyItem } from "../../../dom/index.js";

//renders a list of tracks in the ui
export function renderQueueList(queueListEl, tracks) {
    queueListEl.innerHTML = "";

    if (!Array.isArray(tracks) || !tracks?.length) {
        const item = buildTrackListEmptyItem();
        queueListEl.appendChild(item);
        return;
    }

    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track);
        queueListEl.appendChild(item);
    });
}






