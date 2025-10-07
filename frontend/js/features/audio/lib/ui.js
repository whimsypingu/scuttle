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
export function syncDurationDisplay(durationEl, playerEl) {
    const duration = isNaN(playerEl.duration) ? 0 : playerEl.duration;
    setDurationDisplay(durationEl, duration);
}


//audio progress bar
const fillColor = "var(--text-1)";
const blankColor = "var(--bg-7)";

export function setProgressBar(progBarEl, percent) {
    progBarEl.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${blankColor} ${percent}%, ${blankColor} 100%)`;
}
export function syncProgressBar(progBarEl, playerEl) {
    const duration = playerEl.duration;

    let percent = (playerEl.currentTime / duration) * 100;
    
    if (isNaN(duration) || duration === 0) {
        percent = 0;
    }
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


//helper function to set ui to whatever the song is, and sync up time displays
export function resetUI(playerEl, currTimeEl, progBarEl, durationEl) {
    if (!playerEl) {
        setCurrentTimeDisplay(currTimeEl, 0);
        setProgressBar(progBarEl, 0);
        setDurationDisplay(durationEl, 0);
        return;
    }
    playerEl.currentTime = 0;
    syncCurrentTimeDisplay(currTimeEl, playerEl);
    syncProgressBar(progBarEl, playerEl);
    syncDurationDisplay(durationEl, playerEl);
}

export function setUI(currTimeEl, progBarEl, durationEl, currTime, totalTime) {
    setCurrentTimeDisplay(currTimeEl, currTime);
    setProgressBar(progBarEl, currTime / totalTime);
    setDurationDisplay(durationEl, totalTime);
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
