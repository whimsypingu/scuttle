//static/js/features/audio/ui.js

import { formatTime } from "../../../utils/index.js";


//renders the top element of the queue here
export function renderNowPlaying(titleEl, authorEl, track) {
    if (!track) {
        titleEl.textContent = "---";
        authorEl.textContent = "---";
        return;
    }

    titleEl.textContent = track.title || "Unknown Title";
    authorEl.textContent = track.uploader || "Unknown Artist";
}


//current time
export function setCurrentTimeDisplay(currTimeEl, value) {
    currTimeEl.textContent = formatTime(value);    
}
export function syncCurrentTimeDisplay(currTimeEl, audioEl) {
    const time = isNaN(audioEl.currentTime) ? 0 : audioEl.currentTime;
    setCurrentTimeDisplay(currTimeEl, time)
}


//duration
export function syncDurationDisplay(durationEl, audioEl) {
    const duration = isNaN(audioEl.duration) ? 0 : audioEl.duration;
    durationEl.textContent = formatTime(duration);
}


//audio progress bar
const fillColor = "var(--text-1)";
const blankColor = "var(--bg-7)";

export function setProgressBar(progBarEl, percent) {
    progBarEl.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${blankColor} ${percent}%, ${blankColor} 100%)`;
}
export function syncProgressBar(progBarEl, audioEl) {
    const duration = audioEl.duration;

    let percent = (audioEl.currentTime / duration) * 100;
    
    if (isNaN(duration) || duration === 0) {
        percent = 0;
    }
    setProgressBar(progBarEl, percent);
}

//play and pause button
export function updatePlayPauseButtonDisplay(ppButtEl, isPlaying) {
    const icon = ppButtEl.querySelector("i");

    if (!icon) return;

    icon.className = isPlaying ? "fa fa-pause" : "fa fa-play";
}



//helper function to set ui to whatever the song is, and sync up time displays
export function resetUI(track, titleEl, authorEl, audioEl, currTimeEl, progBarEl, durationEl) {
    renderNowPlaying(titleEl, authorEl, track);

    audioEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, audioEl);
    syncProgressBar(progBarEl, audioEl);
    syncDurationDisplay(durationEl, audioEl);
}
