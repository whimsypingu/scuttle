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


export function setCurrentTimeDisplay(currTimeEl, value) {
    currTimeEl.textContent = formatTime(value);    
}
export function syncCurrentTimeDisplay(currTimeEl, audioEl) {
    const time = isNaN(audioEl.currentTime) ? 0 : audioEl.currentTime;
    setCurrentTimeDisplay(currTimeEl, time)
}


export function syncDurationDisplay(durationEl, audioEl) {
    const duration = isNaN(audioEl.duration) ? 0 : audioEl.duration;
    durationEl.textContent = formatTime(duration);
}


const fillColor = "var(--text-1)";
const blankColor = "var(--bg-7)";

export function setProgressBar(progBarEl, percent) {
    progBarEl.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${blankColor} ${percent}%, ${blankColor} 100%)`;
}
export function syncProgressBar(progBarEl, audioEl) {
    const duration = audioEl.duration;
    if (isNaN(duration) || duration === 0) {
        progBarEl.value = 0;
    }
    else {
        progBarEl.value = (audioEl.currentTime / audioEl.duration) * 100;    
    }
    
    const percentageFilled = progBarEl.value;
    setProgressBar(progBarEl, percentageFilled);
}



export function updatePlayPauseButtonDisplay(ppButtEl, isPlaying) {
    const icon = ppButtEl.querySelector("i");

    if (!icon) return;

    icon.className = isPlaying ? "fa fa-pause" : "fa fa-play";
}



let animationFrameId = null;

export function startProgressBarAnimation(audioEl, progBarEl) {
    function update() {
        const duration = audioEl.duration;
        const current = audioEl.currentTime;

        //console.log(`update(): current = ${current}, duration = ${duration}, progress = ${progBarEl.value}`); // Debug

        if (!isNaN(duration) && duration > 0) {
            progBarEl.value = (current / duration) * 100;
            //console.log(`update(): progress = ${progBarEl.value}`); // Debug
        }

        animationFrameId = requestAnimationFrame(update);
    }

    stopProgressBarAnimation(); // Avoid duplicates
    update();
}

export function stopProgressBarAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}
