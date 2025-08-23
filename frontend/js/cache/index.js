export { 
    getLocalQueueLength, 
    peekLocalQueue,
    setLocalQueue, 
    pushLocalQueue,
    popLocalQueue,
    removeLocalQueueAt,
    setLocalQueueFirst

} from "./localqueue.js";

import Cache from "./indexeddb.js";

import { prepareDataset, parseTrackFromDataset } from "../utils/index.js";


import { logDebug } from "../utils/debug.js";
export async function addBlobToCache(track, blob) {
    const dataset = prepareDataset(track);
    await Cache.set(dataset.youtubeId, dataset, blob);

    logDebug("addBlobToCache", blob.size, blob.type);

    console.log("!!!!!!!!!!! added to cache:", track); //debug
}

export async function getBlobFromCache(track) {    
    const value = await Cache.get(track.youtube_id);

    if (!value) {
        logDebug("getBlobFromCache: no cache entry for", track.youtube_id);
        return null;
    }

    if (!value.blob) {
        logDebug("getBlobFromCache: cache entry has no blob", track.youtube_id);
        return null;
    }

    if (value.blob instanceof Blob && value.blob.size === 0) {
        logDebug("getBlobFromCache: blob is empty", track.youtube_id);
        return null;
    }

    logDebug("getBlobFromCache", value.id, value.blob.size, value.blob.type);
    return value.blob;
}

export async function cacheContainsBlob(track) {
    const blobExists = await Cache.contains(track.youtube_id);
    return blobExists;
}