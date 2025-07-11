//static/js/api/play-api.js
//corresponds to /backend/routers/play-router.py

export async function playTrack() {
    const response = await fetch(`/play`, {
        method: "GET"
    });

    if (!response.ok) {
        throw new Error(`Failed to play: ${response.status}`);
    }

    console.log("/static/js/api/play-api/playTrack status:", response.status);
    return await response.blob(); //returns raw data
}