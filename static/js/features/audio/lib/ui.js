//static/js/features/audio/ui.js

import { formatTime } from "../../../utils/index.js";



export function setCurrentTimeDisplay(currTimeEl, value) {
    currTimeEl.textContent = formatTime(value);    
}


export function syncCurrentTimeDisplay(currTimeEl, audioEl) {
    const time = isNaN(audioEl.currentTime) ? 0 : audioEl.currentTime;
    currTimeEl.textContent = formatTime(time);
}


export function syncDurationDisplay(durationEl, audioEl) {
    const duration = isNaN(audioEl.duration) ? 0 : audioEl.duration;
    durationEl.textContent = formatTime(duration);
}


export function syncProgressBar(progBarEl, audioEl) {
    const duration = audioEl.duration;
    if (isNaN(duration) || duration === 0) {
        progBarEl.value = 0;
    }
    else {
        progBarEl.value = (audioEl.currentTime / audioEl.duration) * 100;    
    }
}


export function updatePlayPauseButtonDisplay(ppButtEl, isPlaying) {
    ppButtEl.textContent = isPlaying ? "⏸️" : "▶️";
}