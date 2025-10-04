import { logDebug } from "../../../utils/debug.js";

let audioCtx, dest;

let currentPlayer = null; //either audioEl (non-ios) or trackEl (ios)

let savedState = null; //to save the state of the audio graph if AudioContext is interrupted (ios)


//credit:
/*
https://www.reddit.com/r/webdev/comments/1ldjqa1/safari_web_audio_api_issue_audiocontext_silently/
https://codepen.io/matteason/pen/VYwdzVV?editors=1010
*/


export function getPlayerEl() {
    return currentPlayer;
}

export function getAudioCtx() {
    return audioCtx;
}


//HOLY JESUS THIS IS TURBO GARBAGE 
function isIosSafari() { 
    const userAgent = navigator.userAgent; 
    logDebug(`userAgent: ${userAgent}`); 
    return /Safari/i.test(userAgent) && /AppleWebKit/i.test(userAgent) && !/Chrome|Android/i.test(userAgent); 
}


/**
 * Handles interruptions to the AudioContext (iOS Safari, phone calls, other media)
 * - Triggered by AudioContext `statechange` events
 * - Marks the context as `_interrupted = true` so "ensureAudioContext" knows to rebuild the AudioContext on next play
 * - Saves the current playback state (src, currentTime) so playback can resume after rebuilding
 */
const handleAudioContextInterrupt = () => {
    if (!currentPlayer) return;
    if (audioCtx.state !== "suspended" && audioCtx.state !=="interrupted") return;

    //mark as interrupted and save state
    audioCtx._interrupted = true;

    savedState = {
        src: currentPlayer.src,
        currentTime: currentPlayer.currentTime,
    };

    logDebug("[handler] Saved current audio state:", savedState);
}


/**
 * Ensures the AudioContext and track wiring are valid before playback for flippity iOS
 * Assumes this is only called for iOS btw!!
 * 
 * Scenarios:
 * - First playback (no AudioContext yet): creates a fresh AudioContext and destination node
 * - User paused playback: No AudioContext rebuild or track element rebuild
 * - Interrupted playback (ex, iOS media or phone call): rebuilds both AudioContext and track element
 * - Next track naturally plays: No AudioContext rebuild, but builds the new element for the new track
 * 
 * Always attaches a `statechange` event listener to track interruptions on any new AudioContext
 * 
 * @param {HTMLAudioElement} audioEl - visible <audio> element used to play the MediaStreamDestination
 * @param {string} srcUrl - source URL of the audio track to be loaded if a new track element
 * @returns 
 */
async function ensureAudioContext(audioEl, srcUrl = null) {
    const initAudioCtx = !audioCtx; //true if there is no existing AudioContext
    const rebuildAudioCtx = audioCtx?._interrupted; //true if an existing AudioContext has been flagged interrupted

    //debugging
    if (initAudioCtx) logDebug("[ensureAudioContext] Initializing fresh AudioContext");
    if (rebuildAudioCtx) logDebug("[ensureAudioContext] Rebuilding AudioContext due to interruption");

    //for rebuilding, tear down first
    if (rebuildAudioCtx) {
        try {
            await audioCtx.close();
            logDebug("[ensureAudioContext] AudioContext closed for rebuild");
        } catch (e) {
            logDebug("[ensureAudioContext] Failed to close AudioContext:", e);
        }

        audioCtx = null;
        dest = null;

        //clean up the audio element
        if (currentPlayer) {
            currentPlayer.pause();

            if (currentPlayer.parentNode) {
                currentPlayer.parentNode.removeChild(currentPlayer);
            }
            currentPlayer = null;

            logDebug("[ensureAudioContext] Nulled currentPlayer");
        }
    }

    //for building a new AudioContext
    if (initAudioCtx || rebuildAudioCtx) {
        audioCtx = new AudioContext();
        audioCtx._interrupted = false;
        
        audioCtx.addEventListener("statechange", handleAudioContextInterrupt);

        dest = audioCtx.createMediaStreamDestination();

        // Your visible <audio> element plays this stream:
        audioEl.srcObject = dest.stream;
        try {
            await audioEl.play();
            logDebug("[ensureAudioContext] Visible element played");
        } catch (err) {
            logDebug("[ensureAudioContext] failed to play visible element:", err);
        }

        //1. build trackEl and connect it
        const trackEl = new Audio(srcUrl);
        trackEl.crossOrigin = "anonymous";

        const node = audioCtx.createMediaElementSource(trackEl);
        node.connect(dest);

        logDebug("loadTrack node connected.");

        //2. prepare the element
        currentPlayer = trackEl;
        trackEl.load();

        //3. set up the event listener on end
        trackEl.addEventListener("ended", () => {
            audioEl.dispatchEvent(new CustomEvent("trackEnded"));
        }, { once: true });

        //4. prepare by setting it on savedState if it exists
        return new Promise((resolve) => {
            trackEl.addEventListener("canplaythrough", () => {
                if (savedState) {
                    //5. trackEl.currentTime should be ready now but who knows really
                    try {
                        trackEl.currentTime = savedState.currentTime || 0;
                        logDebug("loadTrack: restored currentTime:", trackEl.currentTime);
                        logDebug("loadTrack: expected to restore to:", savedState.currentTime);                            
                    } catch (e) {
                        logDebug("loadTrack: failed to set currentTime:", e);
                    }
                }
                resolve(true);
            }, { once: true });
        });
    }
}


export async function loadTrack(audioEl, trackId) {
    //1. check
    if (!trackId) return false;

    //2. point src to backend url, service worker intercepts with caching logic
    const srcPath = `/audio/stream/${trackId}`;
    const fullUrl = new URL(srcPath, window.location.href).href;

    //3. 
    if (isIosSafari()) {
        //
        logDebug("loadTrack iOS detected.")
        await ensureAudioContext(audioEl, fullUrl);

    //4. non-ios
    } else {
        audioEl.src = fullUrl;
        audioEl.load();
        currentPlayer = audioEl;

        return new Promise((resolve) => {
            audioEl.addEventListener("canplaythrough", () => resolve(true), { once: true });
        });
    }
}

export async function playLoadedTrack() {
    if (!currentPlayer) return;

    //debug notif
    logDebug("playLoadedTrack entered.");

    // unlock the AudioContext if needed (iOS Safari)
    if (audioCtx && (audioCtx.state === "suspended" || audioCtx.state === "interrupted")) {
        try {
            await audioCtx.resume();

            logDebug("AudioContext resumed");
        } catch (err) {
            logDebug("Failed to resume AudioContext:", err);
        }
    }

    try {
        //play actual audio element, and pause the audioContext
        await currentPlayer.play();

        logDebug("playback success");

    } catch (err) {
        //desperate retry for ios
        logDebug("playback failed, retrying:", err);
        setTimeout(async () => {
            try {
                await currentPlayer.play();

                logDebug("playback success on retry");
            } catch (retryErr) {
                logDebug("playback failed again:", retryErr);
            }
        }, 200);
    }
}

export function pauseLoadedTrack() {
    if (!currentPlayer) return;

    handleAudioContextInterrupt();

    currentPlayer.pause();
}

/**
 * Returns the current playback state of the active audio track.
 *
 * @returns {boolean|undefined} 
 *   - `true` if the current track is paused,
 *   - `false` if it is playing,
 *   - `undefined` if no track is loaded.
 */
export function trackState() {
    if (!currentPlayer) return;

    return currentPlayer.paused;
}



export async function cleanupCurrentAudio() {
    if (!currentPlayer) return;

    logDebug("before cleanup", "src:", currentPlayer.src, "readyState:", currentPlayer.readyState);

    currentPlayer.pause();

    try {
        URL.revokeObjectURL(currentPlayer.src);
    } catch (e) {
        // ignore if not an object URL
    }

    currentPlayer.removeAttribute("src");

    // remove from DOM only on iOS (hidden trackEl)
    if (isIosSafari() && currentPlayer.parentNode) {
        currentPlayer.parentNode.removeChild(currentPlayer);
    }

    currentPlayer = null;

    //some extra cleanup just in case, may not be necessary here
    savedState = null;

    // tiny delay for iOS
    await new Promise(r => setTimeout(r, 100));

    logDebug("after cleanup");
}
