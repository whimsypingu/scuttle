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



/*
import { queueSetAllTracks, queueSetFirstTrack, queuePushTrack, queuePopTrack } from "./lib/api.js";
export const QUEUE_ACTIONS = {
    SET_ALL: "SetAll",
    SET_FIRST: "SetFirst",
    PUSH: "Push",
    POP: "Pop",
    REMOVE: "Remove",
    REORDER: "Reorder",
};
export async function updateQueue(action, args = {}) {
    try {
        let localResult;

        switch (action) {
            case QUEUE_ACTIONS.SET_ALL:
                // args.ids = array of track IDs
                localResult = QueueStore.setAll(args.ids);
                renderQueue();
                await queueSetAllTracks(args.ids);
                break;

            case QUEUE_ACTIONS.SET_FIRST:
                localResult = QueueStore.setFirst(args.id);
                renderQueue();
                await queueSetFirstTrack(args.id);
                break;

            case QUEUE_ACTIONS.PUSH:
                // args.track = track object
                localResult = QueueStore.push(args.id);
                renderQueue();
                await queuePushTrack(args.id);
                break;

            case QUEUE_ACTIONS.POP:
                localResult = QueueStore.pop();
                renderQueue();
                await queuePopTrack();
                break;

            default:
                console.warn("Unknown queue action:", action);
        }

        return localResult;
    } catch (err) {
        console.error("[updateQueue] Failed:", err);
        throw err; // optional, propagate error
    }
}
*/