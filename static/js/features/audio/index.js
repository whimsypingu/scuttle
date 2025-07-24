
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
import { syncDurationDisplay } from "./lib/ui.js";
import { setAudioSourceFromBlob, waitForAudioMetadata, playAudioWithCleanup } from "./lib/utils.js";

//when audio finishes
export async function playCurrentTrack(ppButtonEl, durationEl) {
    const blob = await getCurrentAudioStream();
    if (!blob) {
        console.warn("No track to play.");
        return;
    }

    const url = setAudioSourceFromBlob(ppButtonEl, blob);
    await waitForAudioMetadata(ppButtonEl);
    syncDurationDisplay(ppButtonEl, durationEl);
    await playAudioWithCleanup(ppButtonEl, url);
}
