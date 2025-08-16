
export { 
    getCurrentAudioStream 
} from "./lib/api.js";

export { 
    renderNowPlaying,
    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    syncDurationDisplay,
    setProgressBar,
    syncProgressBar, 
    updatePlayPauseButtonDisplay,
} from "./lib/ui.js";

export { 
    loadAudioWithId,
    cleanupCurrentAudio
} from "./lib/utils.js";


//for internal use to make constructed functions
import { getAudioStream } from "./lib/api.js";
import { loadAudioWithId, cleanupCurrentAudio } from "./lib/utils.js";
import { getBlobFromCache, addBlobToCache } from "../../cache/index.js";


// export function resetAudioUI(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl) {
//     audioEl.pause();                // Stop any playback
//     audioEl.removeAttribute('src'); //apparently setting to "" or null is not enough
//     audioEl.load();
//     updatePlayPauseButtonDisplay(ppButtonEl, false);
//     stopProgressBarAnimation();
//     syncCurrentTimeDisplay(currTimeEl, audioEl);
//     syncDurationDisplay(durationEl, audioEl); // Will show 0:00 with proper guard
//     progBarEl.value = 0;
// }


import { logDebug } from "../../utils/debug.js";

//when audio finishes
export async function loadTrack(audioEl, track) {
    //1. check
    if (!track) return false;

    let blob = null;
    blob = await getBlobFromCache(track); //this should increment freq in backend cache

    //2. not in cache, fetch from backend
    if (!blob || !(blob instanceof Blob)) {
        logDebug("no blob in cache!");

        blob = await getAudioStream(track); //this should increment freq in backend cache
        await addBlobToCache(track, blob);

        logDebug("blob acquired from backend:", blob.size, blob.type);

        if (!blob) {
            console.warn("No track to play, but idk how we got here.");
            return false;
        }
    }

    //3. load 
    try {
        await loadAudioWithId(audioEl, blob);
        logDebug("AudioLoaded");
    } catch (err) {
        logDebug("LoadFailed");
    }
    return true;
}

export async function playLoadedTrack(audioEl) {
    try {
        await audioEl.play();
    } catch (err) {
        console.warn("Playback blocked:", err);
        logDebug("failedPlayLoadedTrack, src:", audioEl.src, "dur:", audioEl.duration, "readyState:", audioEl.readyState);

        // check for Safari jammed state
        if (
            audioEl.readyState < 2 ||             // not enough data to play
            !isFinite(audioEl.duration) ||        // duration Infinity
            audioEl.error                        // explicit error
        ) {
            logDebug("Audio element jammed, rebuilding…");

            try {
                // clean up current state
                await cleanupCurrentAudio(audioEl);

                // reload from the blob
                await loadAudioWithId(audioEl, blob);

                // retry play once
                await audioEl.play();
                logDebug("Recovered from jammed state.");
            } catch (reloadErr) {
                logDebug("Failed to recover audio:", reloadErr);
            }
        } else {
            // it might just be autoplay blocked by Safari
            logDebug("Probably autoplay policy, user gesture needed.");
        }
    }
}
