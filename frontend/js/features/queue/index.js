import { QueueStore } from "../../cache/QueueStore.js";
import { domEls } from "../../dom/selectors.js";

export { 
    queueSetAllTracks,
    queueSetFirstTrack, 
    queuePushTrack,
    queuePopTrack,
    queueRemoveTrack,
    getQueueContent
} from "./lib/api.js";

export { 
    renderNowPlaying,
    renderQueueList
} from "./lib/ui.js";


import {
    renderNowPlaying,
    renderQueueList
} from "./lib/ui.js";


//ui update
const { queueListEl, titleEl, artistEl } = domEls;

export async function renderQueue() {
    const tracks = QueueStore.getTracks();

    if (!Array.isArray(tracks) || tracks.length === 0) {
        renderNowPlaying(titleEl, artistEl, null);
        renderQueueList(queueListEl, null);
        return;
    }

    const currTrack = tracks[0];
    renderNowPlaying(titleEl, artistEl, currTrack);

    const remainingQueue = tracks.slice(1);
    renderQueueList(queueListEl, remainingQueue);
}
