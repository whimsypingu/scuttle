
export { 
    getAudioStream 
} from "./lib/api.js";

export { 
    setCurrentTimeDisplay, 
    syncCurrentTimeDisplay, 
    syncDurationDisplay,
    setProgressBar,
    syncProgressBar, 
    updatePlayPauseButtonDisplay,

    resetUI,
    updateMediaSession
} from "./lib/ui.js";

export {
    loadTrack,
    playLoadedTrack,
    pauseLoadedTrack,
    trackState,
    cleanupCurrentAudio
} from "./lib/streamTrick.js";

import { logDebug } from "../../utils/debug.js";



/*
export async function loadTrack(audioEl, trackId) {
    //1. check
    if (!trackId) return false;

    //2. point src to backend url, service worker intercepts with caching logic
    audioEl.src = `/audio/stream/${trackId}`;

    const srcPath = `/audio/stream/${trackId}`;
    console.log("audioEl.src (before assignment):", srcPath);
    const fullUrl = new URL(srcPath, window.location.href).href;
    console.log("audioEl.src absolute URL:", fullUrl);

    audioEl.load();

    //3. wait until the metadata is settled
    return new Promise((resolve) => {
        function onCanPlayThrough() {
            audioEl.removeEventListener("canplaythrough", onCanPlayThrough);

            logDebug("audio load success", "readyState:", audioEl.readyState, "dur:", audioEl.duration);

            resolve(true);
        }

        audioEl.addEventListener("canplaythrough", onCanPlayThrough);
    });
}

export async function playLoadedTrack(audioEl) {
    try {
        await audioEl.play();
        logDebug("playback success");
    } catch (err) {
        logDebug("playback failed, retrying:", err);

        // retry after a small delay
        setTimeout(async () => {
            try {
                await audioEl.play();
                logDebug("playback success on retry");
            } catch (retryErr) {
                logDebug("playback failed again:", retryErr);
                // At this point, it really requires a user gesture
            }
        }, 200);
    }
}


export async function cleanupCurrentAudio(audioEl) {
    if (!audioEl.src) return;

    logDebug("before cleanupCurrentAudio", "src:", audioEl.src, "readyState:", audioEl.readyState, "dur:", audioEl.duration);

    audioEl.pause();
    try {
        URL.revokeObjectURL(audioEl.src);
        logDebug("revoked objectURL", audioEl.src);
    } catch (e) {
        logDebug("revokeObjectURL failed", e);
    }
    audioEl.removeAttribute("src");

    // tiny delay for iOS to settle
    await new Promise(r => setTimeout(r, 100));

    logDebug("after cleanupCurrentAudio", "src:", audioEl.src, "readyState:", audioEl.readyState, "dur:", audioEl.duration);
}




*/