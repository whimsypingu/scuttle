//static/js/features/audio/ui.js

import { formatTime } from "../../../utils/index.js";



export function setCurrentTimeDisplay(currTimeEl, value) {
    currTimeEl.textContent = formatTime(value);    
}


export function syncCurrentTimeDisplay(currTimeEl, audioEl) {
    currTimeEl.textContent = formatTime(audioEl.currentTime);
}


export function syncDurationDisplay(audioEl, durationEl) {
    durationEl.textContent = formatTime(audioEl.duration);
}


export function syncProgressBar(progBarEl, audioEl) {
    progBarEl.value = (audioEl.currentTime / audioEl.duration) * 100;
}


export function updatePlayPauseButtonDisplay(ppButtEl, isPlaying) {
    ppButtEl.textContent = isPlaying ? "⏸️" : "▶️";
}