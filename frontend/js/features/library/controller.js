//static/js/features/library/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    loadTrack, 
    playLoadedTrack,
    cleanupCurrentAudio,

    updatePlayPauseButtonDisplay,

    resetUI
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack
} from "../queue/index.js";

import { logDebug } from "../../utils/debug.js";
import { pushLocalQueue, setLocalQueueFirst } from "../../cache/localqueue.js";



//clicking the library list will check for this
export async function onClickLibraryList(e, domEls) {
    //check what was clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    //handle button or whole row pressed
    if (button) {
        if (button.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(dataset);

        } else if (button.classList.contains("more-button")) {
            logDebug("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        logDebug("Play clicked");
        await onClickPlayButton(domEls, dataset);
    }
}


//helpers
async function onClickPlayButton(domEls, dataset) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    try {
        //1. make changes to local queue
        setLocalQueueFirst(track);

        //2. load in the audio
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);

        //3. make optimistic ui changes
        resetUI(track, titleEl, authorEl, audioEl, currTimeEl, progBarEl, durationEl);
        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //4. play audio
        await playLoadedTrack(audioEl);

        //5. send changes to server (returns websocket message to sync ui)
        await queueSetFirstTrack(track);

    } catch (err) {
        logDebug("Failed to play audio:", err);
    }
}

async function onClickQueueButton(dataset) {
    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    //1. update queue (local and backend)
    try {
        pushLocalQueue(track);
        await queuePushTrack(track);
    } catch (err) {
        logDebug("Failed to queue audio:", err);
    }
}




//which action to do "queue", "more"
export async function onSwipe(dataset, action) {
    //const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    //1. handle action type
    if (action === "queue") {
        try {
            pushLocalQueue(track);
            await queuePushTrack(track);

            logDebug("Queue swiped");
        } catch {
            logDebug("Queue failed");
        }
    } else if (action === "more") {
        logDebug("more //BUILD ME", track);
    } else {
        logDebug("unknown swipe action, how did we get here?");
    }
}
