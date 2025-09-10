import { logDebug } from "../../../utils/debug.js";

let audioCtx, dest;

let currentPlayer = null; //either audioEl (non-ios) or trackEl (ios)


export function getPlayerEl() {
    return currentPlayer;
}



function isIosSafari() {
    return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
}


function ensureAudioContext(audioEl) {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        dest = audioCtx.createMediaStreamDestination();
        // Your visible <audio> element plays this stream:
        audioEl.srcObject = dest.stream;
        audioEl.play();

        logDebug("ensureAudioContext Visible element played");
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
        ensureAudioContext(audioEl);

        //
        logDebug("loadTrack audioContext ensured.")
        
        const trackEl = new Audio(fullUrl);
        trackEl.crossOrigin = "anonymous";

        const node = audioCtx.createMediaElementSource(trackEl);
        node.connect(dest);

        //
        logDebug("loadTrack node connected.")        

        currentPlayer = trackEl;
        trackEl.load();

        //4. set up the event listener on end
        trackEl.addEventListener("ended", () => {
            audioEl.dispatchEvent(new CustomEvent("trackEnded"));
        }, { once: true });

        //5.
        return new Promise((resolve) => {
            trackEl.addEventListener("canplaythrough", () => resolve(true), { once: true });
        });

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

export async function playLoadedTrack(audioEl) {
    if (!currentPlayer) return;

    //
    logDebug("playLoadedTrack entered.");

    // unlock the AudioContext if needed (iOS Safari)
    if (audioCtx && audioCtx.state === "suspended") {
        try {
            await audioCtx.resume();
            logDebug("AudioContext resumed");
        } catch (err) {
            logDebug("Failed to resume AudioContext:", err);
        }
    }

    try {
        await currentPlayer.play();



        //
        navigator.mediaSession.metadata = new MediaMetadata({
            title: "test",
            artist: "test",
            artwork: [
                { src: '/frontend/assets/logo.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.setActionHandler("play", () => currentPlayer.play());
        navigator.mediaSession.setActionHandler("pause", () => currentPlayer.pause());

        logDebug("playback success");

    } catch (err) {
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

    currentPlayer.pause();
}


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

    // tiny delay for iOS
    await new Promise(r => setTimeout(r, 100));

    logDebug("after cleanup");
}
