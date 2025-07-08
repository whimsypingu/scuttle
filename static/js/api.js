import { SELECTORS, $ } from "./dom.js"

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
    
    return response.json();
}

//downloads a track
export async function downloadTrack(track) {
    const response = await fetch("/download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(track)
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    return response.json();
}

//plays a track
export function playTrack(track) {
    const youtube_id = track.youtube_id

    const audioPlayer = $(SELECTORS.ID_AUDIO_PLAYER);
    audioPlayer.src = `/play?youtube_id=${youtube_id}`;
    audioPlayer.style.display = "block";
    
    audioPlayer.play().catch(err => {
        alert("Failed to play audio. Make sure the file exists and is accessible.");
        console.error(err);
    });
}