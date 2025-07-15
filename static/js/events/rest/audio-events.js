//static/js/events/rest/audio-events.js

import { $, SELECTORS } from "../../dom/index.js";
import { playTrack, removeTrack } from "../../api/index.js";
import { setAndPlayBlob } from "../../core/audio-player.js";
import { showLoading, hideLoading } from "../../ui/loading-ui.js";

//when audio finishes
export async function onAudioEnded() {
    try {
        showLoading();
        await removeTrack();

        const blob = await playTrack();
        const audioElement = $(SELECTORS.audio.ids.PLAYER);
        
        setAndPlayBlob(audioElement, blob);
    } catch (err) {
        console.error("Failed to play track:", err);
    } finally {
        hideLoading();
    }
}