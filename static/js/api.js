//returns all tracks
export async function fetchAllTracks() {
    const response = await fetch("/tracks");
    return response.json();
}

//searches for a track
export async function searchDbTracks(query) {
    const response = await fetch(`/search/db?q=${encodeURIComponent(query)}`);
    return response.json();
}

//expanded yt search
export async function searchFullTracks(query) {
    const response = await fetch(`/search/full?q=${encodeURIComponent(query)}`);
    return response.json();
}

//plays a track
export function playTrackById(youtubeId) {
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = `/play?youtube_id=${youtubeId}`;
    audioPlayer.style.display = "block";
    audioPlayer.play().catch(err => {
        alert("Failed to play audio. Make sure the file exists and is accessible.");
        console.error(err);
    });
}