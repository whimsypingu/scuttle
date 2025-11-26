//static/js/features/audio/ui.js

import { formatTime } from "../../../utils/index.js";


//visual updates should reflect the TRUE AUDIO ELEMENT not the streaming one on IOS


//current time
export function setCurrentTimeDisplay(currTimeEl, value) {
    currTimeEl.textContent = formatTime(value);    
}
export function syncCurrentTimeDisplay(currTimeEl, playerEl) {
    const time = isNaN(playerEl.currentTime) ? 0 : playerEl.currentTime;
    setCurrentTimeDisplay(currTimeEl, time);
}


//duration
export function setDurationDisplay(durationEl, value) {
    durationEl.textContent = formatTime(value, false);
}
export function syncDurationDisplay(durationEl, currentTrack) {
    const duration = currentTrack?.duration ?? 0; //handles currentTrack existing, and currentTrack.duration existing
    setDurationDisplay(durationEl, duration);
}


//audio progress bar
const fillColor = "var(--text-1)";
const blankColor = "var(--bg-7)";

export function setProgressBar(progBarEl, percent) {
    progBarEl.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${blankColor} ${percent}%, ${blankColor} 100%)`;
}
export function syncProgressBar(progBarEl, playerEl, currentTrack) {
    const duration = currentTrack?.duration ?? 0; //handles currentTrack existing, and currentTrack.duration existing

    if (isNaN(duration) || duration === 0) {
        setProgressBar(progBarEl, 0);
        return;
    }

    const percent = (playerEl.currentTime / duration) * 100;
    setProgressBar(progBarEl, percent);
}

//play and pause button
export function updatePlayPauseButtonDisplay(ppButtEl, isPlaying) {
    const icon = ppButtEl.querySelector("i");

    if (!icon) return;

    icon.className = isPlaying ? "fa fa-pause fa-2x" : "fa fa-play fa-2x";

    //sync media session api
    if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
}


//helper function to set ui to whatever the song is, and sync up time displays after resetting currentTime to 0
export function resetUI(playerEl, currTimeEl, progBarEl, durationEl, currentTrack) {

    if (playerEl) {
        playerEl.currentTime = 0;
    }
    setCurrentTimeDisplay(currTimeEl, 0);
    setProgressBar(progBarEl, 0);

    //attempt to set optimistically the duration if something was at the front of the queue
    syncDurationDisplay(durationEl, currentTrack);
}



export function updateMediaSession(track, isPlaying) {
    document.dispatchEvent(new CustomEvent("trackChangedMediaSession", {
        detail: {
            title: track.title,
            artist: track.artist,
            playing: isPlaying
        }
    }));
}



//toggle loop mode button
export function spinLoopButton(loopButtonEl) {
    loopButtonEl.classList.remove("spin-once");
    void loopButtonEl.offsetWidth; //force reflow
    loopButtonEl.classList.add("spin-once"); //trigger animation
}

export function setLoopButton(loopButtonEl, looping=false, one=false) {
    //any loop (coloring)
    if (looping) {
        loopButtonEl.classList.add("looping");
    } else {
        loopButtonEl.classList.remove("looping");
    }

    //loop one only
    if (one) {
        loopButtonEl.classList.add("one");
    } else {
        loopButtonEl.classList.remove("one");
    }
}
