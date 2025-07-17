//static/js/core/audio-player.js

import { syncDurationDisplay } from "../ui/index.js";

export function setAudioSourceFromBlob(audioElement, blob) {
    const url = URL.createObjectURL(blob);
    audioElement.src = url;
    return url;
}

export function waitForAudioMetadata(audioElement) {
    return new Promise((resolve, reject) => {
        const onLoadedMetadata = () => {
            audioElement.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
        };
        audioElement.addEventListener("loadedmetadata", onLoadedMetadata);
        audioElement.addEventListener("error", reject, { once: true });
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

//sets metadata and visible ui stuff and then plays a blob
export async function setAndPlayBlob(audioElement, blob) {
    if (!blob) {
        console.warn("No track to play.");
        return;
    }

    const url = setAudioSourceFromBlob(audioElement, blob);
    await waitForAudioMetadata(audioElement);

    syncDurationDisplay(audioElement);

    await playAudioWithCleanup(audioElement, url);
}