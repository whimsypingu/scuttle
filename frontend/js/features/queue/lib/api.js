//static/js/features/queue/lib/api.js
//corresponds to /backend/api/routers/queue_router.py

import { postRequest, getResponse } from "../../../utils/index.js";

import { popLocalQueue, pushLocalQueue, removeLocalQueueAt, setLocalQueueFirst } from "../../../cache/localqueue.js";
import { addBlobToCache, cacheContainsBlob } from "../../../cache/index.js";


import { logDebug } from "../../../utils/debug.js";
export async function queueSetFirstTrack(track) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/set-first`, { track });
    console.log("queueSetFirstTrack status:", response.status);

    logDebug("queueSetFirstTrack");

    // //3. fire and forget, if not yet already in cache, cache the blob
    // (async () => {
    //     try {
    //         if (!(await cacheContainsBlob(track))) {
    //             const blobResponse = await getResponse(`/audio/stream/${track.youtube_id}`);
    //             if (blobResponse.ok) {
    //                 const blob = await blobResponse.blob();
    //                 await addBlobToCache(track, blob);
    //             }
    //         }
    //     } catch (err) {
    //         console.warn("Failed to cache blob:", err);
    //     }
    // })();
}


export async function queuePushTrack(track) {
    //1. inform the backend of changes in the frontend
    const response = await postRequest(`/queue/push`, { track });
    console.log("queuePushTrack status:", response.status);

    //2. fire and forget, if not yet already in cache, cache the blob
    (async () => {
        try {
            if (!(await cacheContainsBlob(track))) {
                const blobResponse = await getResponse(`/audio/stream/${track.youtube_id}`);
                if (blobResponse.ok) {
                    const blob = await blobResponse.blob();
                    await addBlobToCache(track, blob);
                }
            }
        } catch (err) {
            console.warn("Failed to cache blob:", err);
        }
    })();
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