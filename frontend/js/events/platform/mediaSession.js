//events/platform/mediaSession.js

import { onNextButtonClick, onPlayPauseButtonClick, onPreviousButtonClick } from "../../features/audio/controller.js";
import { logDebug } from "../../utils/debug.js";



export function registerMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;

    document.addEventListener("trackChangedMediaSession", (e) => {
        if (!("mediaSession" in navigator)) return;

        const { title, artist, playing } = e.detail;

        logDebug("trackChangedMediaSession fired.", title, artist, playing);

        //set metadata 
        // this does NOT necessarily work on iOS background autoplay workaround since it has something to do with streaming blah
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: [
                { 
                    src: "/frontend/assets/logo.png", 
                    sizes: "512x512", 
                    type: "image/png" 
                }
            ]
        });

        navigator.mediaSession.playbackState = playing ? "playing" : "paused";

        //set handlers (needs to be done here instead of once on spawn)
        navigator.mediaSession.setActionHandler("play", () => onPlayPauseButtonClick());
        navigator.mediaSession.setActionHandler("pause", () => onPlayPauseButtonClick());
        navigator.mediaSession.setActionHandler("previoustrack", () => onPreviousButtonClick());
        navigator.mediaSession.setActionHandler("nexttrack", () => onNextButtonClick());
    })
}
