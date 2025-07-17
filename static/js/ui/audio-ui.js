import { $, SELECTORS } from "../dom/index.js";
import { formatTime } from "../utils/index.js";

export function setCurrentTimeDisplay(value) {
    const currentTimeEl = $(SELECTORS.audio.ids.CURRENT_TIME);

    currentTimeEl.textContent = formatTime(value);    
}

export function syncCurrentTimeDisplay(audioElement) {
    const currentTimeEl = $(SELECTORS.audio.ids.CURRENT_TIME);

    currentTimeEl.textContent = formatTime(audioElement.currentTime);
}

export function syncDurationDisplay(audioElement) {
    const durationEl = $(SELECTORS.audio.ids.DURATION);

    if (!audioElement?.duration || isNaN(audioElement.duration)) return;

    durationEl.textContent = formatTime(audioElement.duration);
}