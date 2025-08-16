//should store current queue info here

let localQueue = [];


// Basic getters
export function getLocalQueueLength() {
    return localQueue.length;
}

export function peekLocalQueue() {
    return localQueue[0] || null;
}


// Basic setters (for re-syncing with backend)
export function setLocalQueue(content) {
    localQueue = content;
}


// Queue operations (optimistic updates)
export function pushLocalQueue(track) {
    console.log("localQueue push"); //debug

    localQueue.push(track);
}

export function popLocalQueue() {
    console.log("localQueue pop"); //debug

    return localQueue.shift() || null;    
}

export function removeLocalQueueAt(index) {
    console.log("localQueue remove"); //debug

    if (index >= 0 && index < localQueue.length) {
        localQueue.splice(index, 1);
    }
}

// Optional: helper to replace the first track
export function setLocalQueueFirst(track) {
    console.log("localQueue setFirst"); //debug

    if (localQueue.length > 0) {
        localQueue[0] = track;
    } else {
        localQueue.push(track);
    }
}



/*
async function persistQueue() {
    if (dirty) {
        await Cache.set('queueContents', localQueue);
        dirty = false;
    }
}
*/