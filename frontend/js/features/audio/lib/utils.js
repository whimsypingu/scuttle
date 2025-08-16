//static/js/features/audio/utils.js

let currentLoadId = 0; // Global or module-level
//let currentLoadPromise = null;

// /**
//  * Safely load a blob into an <audio> element with cancellation of older loads.
//  * 
//  * @param {HTMLAudioElement} audioEl - Target audio element.
//  * @param {Blob} blob - Audio blob to load.
//  * @param {boolean} autoplay - Whether to auto-play after load.
//  * @returns {Promise<void>} Resolves when loaded, rejects if cancelled or failed.
//  */
// export function loadAudioWithId(audioEl, blob) {
//     if (!(blob instanceof Blob)) {
//         return Promise.reject(new Error("Invalid blob passed to loadAudioWithId()"));
//     }

//     let finished = false; //prevent multiple resolve/rejects
//     let objectUrl = URL.createObjectURL(blob);

//     const promise = new Promise((resolve, reject) => {
//         const cleanup = () => {
//             audioEl.removeEventListener("canplaythrough", onCanPlayThrough);
//             audioEl.removeEventListener("error", onError);
//             if (!finished) URL.revokeObjectURL(objectUrl);
//         };

//         //maybe canplay is safer than loadedmetadata for fuckass ios
//         const onCanPlayThrough = () => {
//             if (finished) return;
//             finished = true;
//             cleanup();
//             resolve(objectUrl);
//         };

//         const onError = (err) => {
//             if (finished) return;
//             finished = true;
//             cleanup();
//             URL.revokeObjectURL(objectUrl);
//             reject(err || new Error("Failed to load audio from blob"));
//         };

//         //changed to canplaythrough for fuckass ios
//         audioEl.addEventListener("canplaythrough", onCanPlayThrough);
//         audioEl.addEventListener("error", onError);

//         //small delay for fuckass ios to settle the element
//         setTimeout(() => {
//             audioEl.src = objectUrl;
//             audioEl.load();
//         })

//         audioEl.src = objectUrl;
//         audioEl.load();
//     });

//     promise.cancel = () => {
//         if (finished) return;
//         finished = true;
//         URL.revokeObjectURL(objectUrl);
//         currentLoadPromise = null;
//     };

//     currentLoadPromise = promise;
//     return promise;
// }
////////////////


// let currentLoadPromise = null;

// export async function loadAudioWithId(audioEl, blob) {
//     if (!(blob instanceof Blob)) {
//         return Promise.reject(new Error("Invalid blob passed to loadAudioWithId()"));
//     }

//     let finished = false;
//     const objectUrl = URL.createObjectURL(blob);

//     const promise = new Promise((resolve, reject) => {
//         const cleanup = () => {
//             audioEl.removeEventListener("error", onError);
//             if (!finished) URL.revokeObjectURL(objectUrl);
//         };

//         const onError = (err) => {
//             if (finished) return;
//             finished = true;
//             cleanup();
//             reject(err || new Error("Failed to load audio from blob"));
//         };

//         const checkReadyState = () => {
//             if (finished) return;
//             if (audioEl.readyState >= 4) {
//                 finished = true;
//                 cleanup();
//                 resolve(objectUrl);
//             } else {
//                 setTimeout(checkReadyState, 50);
//             }
//         };

//         audioEl.addEventListener("error", onError);

//         // small delay after cleanup for iOS
//         setTimeout(() => {
//             audioEl.src = objectUrl;
//             audioEl.load();
//             checkReadyState();
//         }, 100);
//     });

//     promise.cancel = () => {
//         if (finished) return;
//         finished = true;
//         URL.revokeObjectURL(objectUrl);
//         currentLoadPromise = null;
//     };

//     currentLoadPromise = promise;
//     return promise;
// }

// export async function cleanupCurrentAudio(audioEl) {
//     if (!audioEl.src) return;

//     audioEl.pause();
//     if (audioEl.src) URL.revokeObjectURL(audioEl.src);
//     audioEl.removeAttribute("src");

//     // small delay for iOS to fully release previous blob
//     await new Promise(r => setTimeout(r, 100));
// }




let currentLoadPromise = null;

export async function loadAudioWithId(audioEl, blob) {
    if (!(blob instanceof Blob)) {
        return Promise.reject(new Error("Invalid blob passed to loadAudioWithId()"));
    }

    // cancel any existing load before starting a new one
    if (currentLoadPromise && typeof currentLoadPromise.cancel === "function") {
        currentLoadPromise.cancel();
    }

    let finished = false;
    const objectUrl = URL.createObjectURL(blob);

    const promise = new Promise((resolve, reject) => {
        const cleanup = () => {
            audioEl.removeEventListener("error", onError);
            if (!finished) URL.revokeObjectURL(objectUrl);
            if (currentLoadPromise === promise) {
                currentLoadPromise = null;
            }
        };

        const onError = (err) => {
            if (finished) return;
            finished = true;
            cleanup();
            reject(err || new Error("Failed to load audio from blob"));
        };

        const checkReadyState = () => {
            if (finished) return;
            if (audioEl.readyState >= 4) {
                finished = true;
                cleanup();
                resolve(objectUrl);
            } else {
                setTimeout(checkReadyState, 50);
            }
        };

        audioEl.addEventListener("error", onError);

        // small delay after cleanup for iOS
        setTimeout(() => {
            if (finished) return; // if cancelled during delay, bail
            audioEl.src = objectUrl;
            audioEl.load();
            checkReadyState();
        }, 100);
    });

    // attach cancel
    promise.cancel = () => {
        if (finished) return;
        finished = true;
        URL.revokeObjectURL(objectUrl);
        if (currentLoadPromise === promise) {
            currentLoadPromise = null;
        }
    };

    currentLoadPromise = promise;
    return promise;
}

export async function cleanupCurrentAudio(audioEl) {
    if (!audioEl.src) return;

    audioEl.pause();
    try {
        URL.revokeObjectURL(audioEl.src);
    } catch {}
    audioEl.removeAttribute("src");

    // tiny delay for iOS to settle
    await new Promise(r => setTimeout(r, 100));
}
















//


export function setAudioSourceFromBlob(audioElement, blob) {
    const url = URL.createObjectURL(blob);
    audioElement.src = url;
    return url;
}

import { logDebug } from "../../../utils/debug.js";
export function waitForAudioMetadata(audioElement, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        //1. validity check, isFinite is required for iOS (cringe)
        const isValidDuration = () => (
            isFinite(audioElement.duration) &&
            !isNaN(audioElement.duration) &&
            audioElement.duration > 0
        );

        //2. if already valid, resolve immediately
        if (isValidDuration()) {
            return resolve();
        }

        //3. event handlers
        const onLoaded = () => {
            if (isValidDuration()) {
                cleanup();
                resolve();
            }
        };
        const onCanPlay = () => {
            if (isValidDuration()) {
                cleanup();
                resolve();
            }
        };
        const onError = () => {
            cleanup();
            reject(new Error("failed to load metadata"));
        };
        const onTimeout = () => {
            cleanup();
            reject(new Error("timed out waiting for metadata"));
        };

        //4. attach listeners
        logDebug("waiting for metadata");

        // audioElement.addEventListener("loadedmetadata", () => logDebug("Metadata loaded:", audio.duration));
        // audioElement.addEventListener("error", e => logDebug("Audio error:", e));
        // audioElement.addEventListener("play", () => logDebug("Playback started"));

        audioElement.addEventListener("loadedmetadata", onLoaded);
        audioElement.addEventListener("canplay", onCanPlay);
        audioElement.addEventListener("error", onError);
        const timer = setTimeout(onTimeout, timeoutMs);

        const cleanup = () => {
            audioElement.removeEventListener("loadedmetadata", onLoaded);
            audioElement.removeEventListener("canplay", onCanPlay);
            audioElement.removeEventListener("error", onError);
            clearTimeout(timer);
        }
    });
}


export async function playAudioWithCleanup(audioElement, url) {
    try {
        await audioElement.play();
        audioElement.onended = () => {
            URL.revokeObjectURL(url);
        };
    } catch (e) {
        console.error("Audio playback failed:", e);
        URL.revokeObjectURL(url);
    }
}
