//static/js/api/music-api.js

import { SELECTORS, $ } from "../dom/index.js"

//searches for a track
export async function searchDbTracks(q) {
    const response = await fetch(`/search/db?q=${encodeURIComponent(q)}`);
    return response.json();
}

//expanded yt search
export async function searchFullTracks(q) {
    const response = await fetch("/search/full", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ q })
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    
    console.log("Search status", response.status)
    return response.json();
}

//downloads a track
export async function downloadTrack(track) {
    const response = await fetch("/download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track })
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    console.log("Download status", response.status)
    return;
}

//plays a track
export function playTrack(track) {
    const youtube_id = track.youtube_id

    const audioPlayer = $(SELECTORS.audio.ids.PLAYER);
    audioPlayer.src = `/play?youtube_id=${youtube_id}`;
    audioPlayer.style.display = "block";
    
    audioPlayer.play().catch(err => {
        alert("Failed to play audio. Make sure the file exists and is accessible.");
        console.error(err);
    });
}



//CHANGE THIS LATER
const DEFAULT_QUEUE = "default";

export async function queueTrack(track, queueName = DEFAULT_QUEUE) {
    const response = await fetch(`/queue/${queueName}/push`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track })
    });

    if (!response.ok) {
        throw new Error(`Failed to add to queue: ${response.status}`);
    }

    console.log("Queueing status", response.status)
    return;
}

export async function getQueue(queueName = DEFAULT_QUEUE) {
    const response = await fetch(`/queue/${queueName}`);

    if (!response.ok) {
        throw new Error(`Failed to get queue: ${response.status}`);
    }

    console.log("Get queue status", response.status)
    return response.json();
}

