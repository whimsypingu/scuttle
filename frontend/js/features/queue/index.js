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
const { queueListEl, titleEl, authorEl } = domEls;

export async function redrawQueueUI(tracks) {
    if (!Array.isArray(tracks) || tracks.length === 0) {
        renderNowPlaying(titleEl, authorEl, null);
        renderQueueList(queueListEl, null);
        return;
    }

    const currTrack = tracks[0];
    renderNowPlaying(titleEl, authorEl, currTrack);

    const remainingQueue = tracks.slice(1);
    renderQueueList(queueListEl, remainingQueue);
}
