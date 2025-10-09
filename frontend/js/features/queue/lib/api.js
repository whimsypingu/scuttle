//static/js/features/queue/lib/api.js
//corresponds to /backend/api/routers/queue_router.py

import { postRequest, getResponse } from "../../../utils/index.js";

import { logDebug } from "../../../utils/debug.js";


export async function queueSetAllTracks(ids) {
    //1. inform backend
    const response = await postRequest(`/queue/set-all`, { ids });
    console.log("queueSetAllTracks status:", response.status);

    //2. fire and forget caching, non blocking (not await-ed) and kind of half ass batched
    ids.forEach((id, index) => {
        setTimeout(() => {
            fetch(`/audio/stream/${id}`).catch(err => {
                logDebug(`queueSetAllTracks prefetch failed for ${id}:`, err);
            });
        }, index * 200);
    });
}


export async function queueSetFirstTrack(id) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/set-first`, { id });
    console.log("queueSetFirstTrack status:", response.status);

    logDebug("queueSetFirstTrack");
}


export async function queuePushTrack(id) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/push`, { id });
    console.log("queuePushTrack status:", response.status);

    //2. fire and forget for caching purposes (service worker will eat this uppp)
    fetch(`/audio/stream/${id}`).catch((err) => {
        logDebug("queuePushTrack prefetch failed:", err);
    });
}


export async function queuePushFrontTrack(id) {
    //1. inform backend of changes in frontend
    const response = await postRequest(`/queue/push-front`, { id });
    console.log("queuePushFrontTrack status:", response.status);

    //2. fire and forget for caching purposes
    fetch(`/audio/stream/${id}`).catch((err) => {
        logDebug("queuePushFrontTrack prefetch failed:", err);
    });
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