//static/js/features/queue/lib/api.js
//corresponds to /backend/api/routers/queue_router.py

import { postRequest, getResponse } from "../../../utils/index.js";

import { logDebug } from "../../../utils/debug.js";


export async function queueSetFirstTrack(track) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/set-first`, { track });
    console.log("queueSetFirstTrack status:", response.status);

    logDebug("queueSetFirstTrack");
}


export async function queuePushTrack(track) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/push`, { track });
    console.log("queuePushTrack status:", response.status);

    //2. fire and forget for caching purposes (service worker will eat this uppp)
    fetch(`/audio/stream/${track.youtube_id}`).catch((err) => {
        logDebug("queuePushTrack prefetch failed:", err);
    })
}


export async function queuePopTrack() {
    const response = await postRequest(`/queue/pop`, { });
    console.log("queuePopTrack status:", response.status);
}


export async function queueRemoveTrack(index) {
    const response = await postRequest(`/queue/remove-at`, { index });
    console.log("queueRemoveTrack status:", response.status);
}


export async function getQueueContent() {
    const response = await getResponse(`/queue/content`);
    console.log("getQueueContent status:", response.status);
    const data = await response.json();
    return data;
}