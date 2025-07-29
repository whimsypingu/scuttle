
export { 
    getCurrentAudioStream 
} from "./lib/api.js";

export { 
    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    syncDurationDisplay, 
    syncProgressBar, 
    updatePlayPauseButtonDisplay 
} from "./lib/ui.js";

export { 
    setAudioSourceFromBlob, 
    waitForAudioMetadata, 
    playAudioWithCleanup 
} from "./lib/utils.js";


//for internal use to make constructed functions
import { getCurrentAudioStream } from "./lib/api.js";
import { syncCurrentTimeDisplay, syncDurationDisplay, updatePlayPauseButtonDisplay } from "./lib/ui.js";
import { setAudioSourceFromBlob, waitForAudioMetadata, playAudioWithCleanup } from "./lib/utils.js";


export function resetAudioUI(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl) {
    audioEl.pause();                // Stop any playback
    audioEl.removeAttribute('src'); //apparently setting to "" or null is not enough
    audioEl.load();
    updatePlayPauseButtonDisplay(ppButtonEl, false);
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncDurationDisplay(durationEl, audioEl); // Will show 0:00 with proper guard
    progBarEl.value = 0;
}

//when audio finishes
export async function playCurrentTrack(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl) {
    const blob = await getCurrentAudioStream();
    if (!blob) {
        console.warn("No track to play.");
        resetAudioUI(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl);
        return;
    }

    const url = setAudioSourceFromBlob(audioEl, blob);
    await waitForAudioMetadata(audioEl);
    syncDurationDisplay(durationEl, audioEl);
    await playAudioWithCleanup(audioEl, url);
    updatePlayPauseButtonDisplay(ppButtonEl, true);
}
