//static/js/features/library/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    cleanupCurrentAudio,
    loadTrack, 
    playLoadedTrack,
    renderNowPlaying,
    syncCurrentTimeDisplay,
    syncProgressBar,
    syncDurationDisplay,
    updatePlayPauseButtonDisplay
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack
} from "../queue/index.js";

import { logDebug } from "../../utils/debug.js";
import { pushLocalQueue, setLocalQueueFirst } from "../../cache/localqueue.js";



//clicking the library list will check for this
export async function onClickLibraryList(e, domEls) {
    //check button clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    if (button) {
        if (button.classList.contains("queue-button")) {
            console.log("queued", li?.dataset);

            await onClickQueueButton(dataset);
        } else if (button.classList.contains("more-button")) {
            console.log("more //BUILD ME", li?.dataset);
        }
    } else if (li) {
        console.log("list item clicked:", li.dataset)

        await onClickPlayButton(domEls, dataset);
    }
}


//helpers
async function onClickPlayButton(domEls, dataset) {
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        console.error("Missing track data attributes in dataset");
        logDebug("bad_dataset");
        return;
    }

    try {
        //1. make changes to local queue
        setLocalQueueFirst(track);

        //2. load in the blob
        await cleanupCurrentAudio(audioEl);
        await loadTrack(audioEl, track);

        logDebug("metadata_loaded"); //debug

        //3. make optimistic ui changes
        renderNowPlaying(titleEl, authorEl, track);

        audioEl.currentTime = 0;
        syncCurrentTimeDisplay(currTimeEl, audioEl);
        syncProgressBar(progBarEl, audioEl);
        syncDurationDisplay(durationEl, audioEl);

        updatePlayPauseButtonDisplay(ppButtonEl, true);
        
        //4. play audio
        await playLoadedTrack(audioEl);

        //5. send changes to server (returns websocket message to sync ui)
        await queueSetFirstTrack(track);

    } catch (err) {
        logDebug("Failure");
        console.error("Failed to play audio:", err);
    }
}

async function onClickQueueButton(dataset) {
    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }

    try {
        pushLocalQueue(track);
        await queuePushTrack(track);

        console.log("Queued track:", track);
    } catch (err) {
        console.error("Failed to queue audio:", err);
    }
}




//which action to do "queue", "more"
export async function onSwipeLibrary(dataset, action) {
    //const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl } = domEls;

    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        console.error("Missing track data attributes in dataset");
        return;
    }

    if (action === "queue") {
        try {
            pushLocalQueue(track);
            await queuePushTrack(track);

            logDebug("queue_success");
        } catch {
            logDebug("queue_failed");
        }
    } else if (action === "more") {
        logDebug("more");
    } else {
        logDebug("unknown_swipe_action");
    }
}
