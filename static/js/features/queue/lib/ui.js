//static/js/features/queue/ui.js

import { buildTrackListItem } from "../../../dom/index.js";

//renders a list of tracks in the ui
export function renderQueueList(queueListEl, tracks) {
    queueListEl.innerHTML = "";

    if (!tracks?.length) {
        queueListEl.innerHTML = "<li>No tracks available</li>";
        return;
    }

    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track, "queue")
        queueListEl.appendChild(item);
    });
}






