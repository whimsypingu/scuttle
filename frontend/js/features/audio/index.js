
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
    startProgressBarAnimation,
    stopProgressBarAnimation
} from "./lib/ui.js";

export { 
    setAudioSourceFromBlob, 
    waitForAudioMetadata, 
    playAudioWithCleanup 
} from "./lib/utils.js";


//for internal use to make constructed functions
import { getCurrentAudioStream } from "./lib/api.js";
import { startProgressBarAnimation, stopProgressBarAnimation, syncCurrentTimeDisplay, syncDurationDisplay, syncProgressBar, updatePlayPauseButtonDisplay } from "./lib/ui.js";
import { setAudioSourceFromBlob, waitForAudioMetadata, playAudioWithCleanup } from "./lib/utils.js";


export function resetAudioUI(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl) {
    audioEl.pause();                // Stop any playback
    audioEl.removeAttribute('src'); //apparently setting to "" or null is not enough
    audioEl.load();
    updatePlayPauseButtonDisplay(ppButtonEl, false);
    stopProgressBarAnimation();
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncDurationDisplay(durationEl, audioEl); // Will show 0:00 with proper guard
    progBarEl.value = 0;
}

//when audio finishes
export async function playCurrentTrack(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl, animate) {
    const blob = await getCurrentAudioStream();
    if (!blob) {
        console.warn("No track to play.");
        resetAudioUI(audioEl, durationEl, ppButtonEl, currTimeEl, progBarEl);
        return false;
    }

    const url = setAudioSourceFromBlob(audioEl, blob);
    await waitForAudioMetadata(audioEl);
    syncDurationDisplay(durationEl, audioEl);
    await playAudioWithCleanup(audioEl, url);
    updatePlayPauseButtonDisplay(ppButtonEl, true);
    syncProgressBar(progBarEl, audioEl);

    if (animate) {
        startProgressBarAnimation(audioEl, progBarEl);
    }
    return true;
}
