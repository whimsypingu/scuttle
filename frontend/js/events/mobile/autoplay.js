// autoplay.js

//DEPRECATED, FUCK IOS

import { logDebug } from "../../utils/debug.js";
export function unlockAudio() {
    // Only unlock once
    let unlocked = false;

    const audioEl = document.getElementById("audio-player");

    function unlock() {
        if (unlocked) return;
        unlocked = true;

        // temporarily set a small silent audio source
        audioEl.src = "frontend/assets/silent.mp3";

        // play/pause trick to unlock iOS
        audioEl.play()
            .then(() => audioEl.pause())
            .catch(() => {
                logDebug("failed to unlock");
            });

        logDebug("unlocked");

        // Remove listener once done
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("click", unlock);
    }

    // Wait for first user gesture
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });
}
