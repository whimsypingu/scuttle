//static/js/features/queue/controller.js

import { parseTrackFromDataset } from "../../utils/index.js"

import { 
    loadTrack, 
    playLoadedTrack,
    cleanupCurrentAudio,

    updatePlayPauseButtonDisplay,

    resetUI,
    updateMediaSession
} from "../audio/index.js";

import { 
    queuePushTrack,
    queueSetFirstTrack,
    renderNowPlaying,
    renderQueueList
} from "./index.js";



// //ui update
// export async function renderQueueUI(domEls, tracks) {
//     const { queueListEl, titleEl, authorEl } = domEls;

//     if (!Array.isArray(tracks) || tracks.length === 0) {
//         renderNowPlaying(titleEl, authorEl, null);
//         renderQueueList(queueListEl, null);
//         return;
//     }

//     const currTrack = tracks[0];
//     renderNowPlaying(titleEl, authorEl, currTrack);

//     const remainingQueue = tracks.slice(1);
//     renderQueueList(queueListEl, remainingQueue);
// }


//clicking the queue list will check for this
export async function onClickQueueList(e, domEls) {
    //check what was clicked
    const button = e.target.closest("button");
    const li = e.target.closest("li.list-track-item");
    const dataset = li?.dataset;

    //handle button or whole row pressed
    if (button) {
        if (button.classList.contains("queue-button")) {
            logDebug("Queue clicked");
            await onClickQueueButton(domEls, dataset);

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
    const { audioEl, titleEl, authorEl, currTimeEl, progBarEl, durationEl, ppButtonEl, queueListEl } = domEls;

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
        updateMediaSession(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, getLocalQueue());
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


async function onClickQueueButton(domEls, dataset) {
    const { titleEl, authorEl, queueListEl } = domEls;

    //0. parse data
    const track = parseTrackFromDataset(dataset);

    if (!track) {
        logDebug("Missing track data attributes in dataset");
        return;
    }

    //1. update queue (local and backend)
    try {
        pushLocalQueue(track);
        redrawQueueUI(queueListEl, titleEl, authorEl, getLocalQueue());

        await queuePushTrack(track);
    } catch (err) {
        logDebug("Failed to queue audio:", err);
    }
}



//onSwipe is defined in library and i think works for both... consider moving to a separate swipe function