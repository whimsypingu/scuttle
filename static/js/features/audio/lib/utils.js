//static/js/features/audio/utils.js


export function setAudioSourceFromBlob(audioElement, blob) {
    const url = URL.createObjectURL(blob);
    audioElement.src = url;
    return url;
}


export function waitForAudioMetadata(audioElement) {
    return new Promise((resolve, reject) => {
        //if metadata is already available, resolve immediately
        if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
            return resolve();
        }
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
