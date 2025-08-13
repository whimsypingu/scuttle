//static/js/events/rest/audio-events.js

import { $, SELECTORS } from "../../dom/index.js";
import { playTrack, removeTrack } from "../../api/index.js";
import { setAndPlayBlob } from "../../core/audio-player.js";
import { showLoading, hideLoading } from "../../ui/loading-ui.js";
import { formatTime } from "../../utils/parsers.js";
import { setCurrentTimeDisplay, syncCurrentTimeDisplay } from "../../ui/audio-ui.js";

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

//on button clicks
export async function onNextButtonClick() {
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

export function onPlayPauseButtonClick() {
    const audioElement = $(SELECTORS.audio.ids.PLAYER);
    const ppButton = $(SELECTORS.audio.ids.PLAY_PAUSE_BUTTON);

    if (!audioElement.src) {
        console.warn("No audio source set");
        return;
    }

    if (audioElement.paused) {
        audioElement.play();
        ppButton.textContent = "⏸️";
    } else {
        audioElement.pause();
        ppButton.textContent = "▶️";
    }
}

export function onPreviousButtonClick() {
    const audioElement = $(SELECTORS.audio.ids.PLAYER);
    audioElement.currentTime = 0;
}



//scrubber logic and events
let isSeeking = false;

export function onProgressBarPointerdown() {
    isSeeking = true;
}

export function onProgressBarInput() {
    const progressBar = $(SELECTORS.audio.ids.PROGRESS_BAR);    
    const audioElement = $(SELECTORS.audio.ids.PLAYER);

    const seekTime = (progressBar.value / 100) * audioElement.duration;
    setCurrentTimeDisplay(seekTime);
}

export function updateAudioProgress() {
    if (isSeeking) return; //does not update when user is manually scrubbing

    const audioElement = $(SELECTORS.audio.ids.PLAYER);
    const progressBar = $(SELECTORS.audio.ids.PROGRESS_BAR);
    const currentTimeEl = $(SELECTORS.audio.ids.CURRENT_TIME);

    progressBar.value = (audioElement.currentTime / audioElement.duration) * 100;
    currentTimeEl.textContent = formatTime(audioElement.currentTime);
}

export function onProgressBarPointerup() {
    isSeeking = false;

    const progressBar = $(SELECTORS.audio.ids.PROGRESS_BAR);    
    const audioElement = $(SELECTORS.audio.ids.PLAYER);

    const seekTime = (progressBar.value / 100) * audioElement.duration;
    audioElement.currentTime = seekTime; //set and sync
    syncCurrentTimeDisplay(audioElement);
}