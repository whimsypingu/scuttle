//static/js/core/audio-player.js

export async function setAndPlayBlob(audioElement, blob) {
    if (!blob) {
        console.warn("No next track to play.");
        return;
    }

    const url = URL.createObjectURL(blob);

    //stop memory leaks
    if (audioElement.src?.startsWith("blob:")) {
        URL.revokeObjectURL(audioElement.src);
    }

    audioElement.src = url;
    await audioElement.play();
}
