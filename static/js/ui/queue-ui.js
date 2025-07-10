//static/js/ui/queue-ui.js

import { $, SELECTORS, buildTrackListItem } from "../dom/index.js";

//renders a list of tracks in the ui
export function renderQueueList(tracks) {
    const queueList = $(SELECTORS.queue.ids.LIST);
    queueList.innerHTML = "";

    if (!tracks?.length) return;

    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track, "queue")
        queueList.appendChild(item);
    });
}






