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



function isIosSafari() {
    return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
}

const handleAudioContextInterrupt = () => {
    if (!currentPlayer) return;

    if (audioCtx.state !== "suspended" && audioCtx.state !=="interrupted") return;

    audioCtx._interrupted = true;

    savedState = {
        src: currentPlayer.src,
        currentTime: currentPlayer.currentTime,
        paused: true
    };

    logDebug(`[handler] audioCtx.state: ${audioCtx.state}`);
    logDebug("[handler] Saved current audio state:", savedState);
}

async function ensureAudioContext(audioEl) {
    const initAudioCtx = !audioCtx;
    const rebuildAudioCtx = audioCtx?._interrupted;
    const buildTrackEl = !audioCtx?._paused;

    if (initAudioCtx) logDebug("[ensureAudioContext] Initializing fresh AudioContext");
    if (rebuildAudioCtx) logDebug("[ensureAudioContext] Rebuilding AudioContext due to interruption");
    if (audioCtx?._paused) logDebug("[ensureAudioContext] Paused context, skipping rebuild");


    if (rebuildAudioCtx) {
        //build
        try {
            await audioCtx.close();
            logDebug("[ensureAudioContext] AudioContext closed for rebuild");
        } catch (e) {
            logDebug("[ensureAudioContext] Failed to close AudioContext:", e);
        }

        audioCtx = null;
        dest = null;

        if (currentPlayer) {
            currentPlayer.pause();
            currentPlayer = null;

            logDebug("[ensureAudioContext] Nulled currentPlayer");
        }
    }

    if (initAudioCtx || rebuildAudioCtx) {
        audioCtx = new AudioContext();
        audioCtx._paused = false;
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
    }
    return buildTrackEl;

    let rebuilt = false;
    if (audioCtx) {
        if (audioCtx.state === "running" && !savedState) {
            logDebug("[ensureAudioContext] audioCtx second+ run, already running and no savedState, nothing to do");
            return rebuilt;
        }

        try {
            await audioCtx.close();
            logDebug("[ensureAudioContext] AudioContext closed for rebuild");
        } catch (e) {
            logDebug("[ensureAudioContext] Failed to close AudioContext:", e);
        }

        audioCtx = null;
        dest = null;

        if (currentPlayer) {
            currentPlayer.pause();
            currentPlayer = null;

            logDebug("[ensureAudioContext] Nulled currentPlayer");
        }
    }

    audioCtx = new AudioContext();
    dest = audioCtx.createMediaStreamDestination();

    // Your visible <audio> element plays this stream:
    audioEl.srcObject = dest.stream;
    try {
        await audioEl.play();
        logDebug("[ensureAudioContext] Visible element played");
    } catch (err) {
        logDebug("[ensureAudioContext] failed to play visible element:", err);
    }

    rebuilt = true;
    return rebuilt;
}


//ios bugfix: when audio is playing, interrupted by another app like spotify or youtube, then return to this audio
export async function rebuildAudioGraph(audioEl) {
    // if (isIosSafari()) {
    //     if (!savedState.src) return;

    //     logDebug("[rebuildAudioGraph] attempting rebuild");

    //     //clean up audioContext
    //     try {
    //         if (audioCtx._interruptWatcherAttached) {
    //             audioCtx.removeEventListener("statechange", handleAudioContextInterrupt);

    //             logDebug("[rebuildAudioGraph] removed old event listener");
    //         }
    //         await audioCtx.close();
    //         audioCtx = null;
    //         dest = null;

    //         logDebug("[rebuildAudioGraph] audioCtx closed");
    //     } catch (e) {
    //         logDebug(`[rebuildAudioGraph] audioCtx close FAILED, ${e}`);
    //     }

    //     //clean up old audio elements
    //     try {
    //         if (currentPlayer) {
    //             if (currentPlayer.parentNode) currentPlayer.parentNode.removeChild(currentPlayer);
    //             currentPlayer.src = "";
    //             currentPlayer = null;

    //             logDebug("[rebuildAudioGraph] currentPlayer revoked");
    //         }
    //     } catch (e) {
    //         logDebug("[rebuildAudioGraph] currentPlayer revoke FAILED:", e);
    //     }


    //     //rebuild the entire audio graph based on the saved state
    //     audioCtx = new AudioContext();
    //     dest = audioCtx.createMediaStreamDestination();
        
    //     logDebug("[rebuildAudioGraph] rebuilt audio context");

    //     // create a new <audio> element and wire it up
    //     logDebug("[rebuildAudioGraph] src about to use:", savedState.src);

    //     try {
    //         await new Promise(r => setTimeout(r, 50));
    //         trackEl = new Audio(savedState.src);
    //         logDebug("[rebuildAudioGraph] made new audio el");
    //     } catch (e) {
    //         logDebug("[rebuildAudioGraph] Audio() constructor FAILED:", e);
    //     }

    //     //trackEl = new Audio(savedState.src);
    //     trackEl.crossOrigin = "anonymous";

    //     const node = audioCtx.createMediaElementSource(trackEl);
    //     node.connect(dest);

    //     logDebug("[rebuildAudioGraph] node connected");

    //     currentPlayer = trackEl;
    //     trackEl.load();

    //     logDebug("[rebuildAudioGraph] audio el load call");

    //     try {
    //         trackEl.currentTime = savedState.currentTime || 0;
    //         logDebug(`[rebuildAudioGraph] set new track with time: ${trackEl.currentTime}`);
    //     } catch (e) {
    //         logDebug("[rebuildAudioGraph] failed to set currentTime:", e);
    //     }


    //     //4. set up the event listener on end
    //     trackEl.addEventListener("ended", () => {
    //         audioEl.dispatchEvent(new CustomEvent("trackEnded"));
    //     }, { once: true });

    //     //5.
    //     return new Promise((resolve) => {
    //         trackEl.addEventListener("canplaythrough", () => resolve(true), { once: true });
    //     });
    // }
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
        const rebuilt = await ensureAudioContext(audioEl);

        //
        logDebug("loadTrack audioContext ensured, rebuilt:", rebuilt);
        
        if (rebuilt) {

            const trackEl = new Audio(fullUrl);
            trackEl.crossOrigin = "anonymous";

            const node = audioCtx.createMediaElementSource(trackEl);
            node.connect(dest);

            //
            logDebug("loadTrack node connected.");

            currentPlayer = trackEl;
            trackEl.load();

            //
            // try {
            //     trackEl.currentTime = savedState.currentTime || 0;
            //     logDebug("loadTrack: restored currentTime:", trackEl.currentTime);
            //     logDebug("loadTrack: expected to restore to:", savedState.currentTime);
            // } catch (e) {
            //     logDebug("loadTrack: failed to set currentTime:", e);
            // }


            //4. set up the event listener on end
            trackEl.addEventListener("ended", () => {
                audioEl.dispatchEvent(new CustomEvent("trackEnded"));
            }, { once: true });

            //5.
            return new Promise((resolve) => {
                trackEl.addEventListener("canplaythrough", () => {
                    try {
                        if (savedState) {
                            trackEl.currentTime = savedState.currentTime || 0;
                            logDebug("loadTrack: restored currentTime:", trackEl.currentTime);
                            logDebug("loadTrack: expected to restore to:", savedState.currentTime);                            
                        }
                    } catch (e) {
                            logDebug("loadTrack: failed to set currentTime:", e);
                    }
                    resolve(true);
                }, { once: true });
            });
        }


    //5. non-ios
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

    //
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
        await currentPlayer.play();
        audioCtx._paused = false;
        logDebug("playback success");

    } catch (err) {
        logDebug("playback failed, retrying:", err);
        setTimeout(async () => {
            try {
                await currentPlayer.play();
                audioCtx._paused = false;
                logDebug("playback success on retry");
            } catch (retryErr) {
                logDebug("playback failed again:", retryErr);
            }
        }, 200);
    }
}

export function pauseLoadedTrack() {
    if (!currentPlayer) return;

    audioCtx._paused = true;
    savedState = null;

    currentPlayer.pause();
}


export function trackState() {
    /**
     * Returns the current playback state of the active audio track.
     *
     * @returns {boolean|undefined} 
     *   - `true` if the current track is paused,
     *   - `false` if it is playing,
     *   - `undefined` if no track is loaded.
     */
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

    // tiny delay for iOS
    await new Promise(r => setTimeout(r, 100));

    logDebug("after cleanup");
}
