//events/platform/mediaSession.js

import { SELECTORS, $ } from "../../dom/index.js";
import { onNextButtonClick, onPlayPauseButtonClick, onPreviousButtonClick } from "../../features/audio/controller.js";
import { logDebug } from "../../utils/debug.js";



export function registerMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;

    const domEls = {
        audioEl: $(SELECTORS.audio.ids.PLAYER),
        titleEl: $(SELECTORS.audio.ids.TITLE),
        authorEl: $(SELECTORS.audio.ids.AUTHOR),

        currTimeEl: $(SELECTORS.audio.ids.CURRENT_TIME),
        progBarEl: $(SELECTORS.audio.ids.PROGRESS_BAR),
        durationEl: $(SELECTORS.audio.ids.DURATION),

        ppButtonEl: $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON),

        nextButtonEl: $(SELECTORS.audio.ids.NEXT_BUTTON),
        prevButtonEl: $(SELECTORS.audio.ids.PREVIOUS_BUTTON),
    };

    document.addEventListener("trackChangedMediaSession", (e) => {
        if (!("mediaSession" in navigator)) return;

        const { title, artist } = e.detail;

        logDebug("queueUpdated:", title, artist);

        //set metadata
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

        //set handlers (needs to be done here instead of once on spawn because of ios dammit)
        navigator.mediaSession.setActionHandler("play", () => onPlayPauseButtonClick(domEls));
        navigator.mediaSession.setActionHandler("pause", () => onPlayPauseButtonClick(domEls));
        navigator.mediaSession.setActionHandler("previoustrack", () => onPreviousButtonClick(domEls));
        navigator.mediaSession.setActionHandler("nexttrack", () => onNextButtonClick(domEls));
    })
}
