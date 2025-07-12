//static/js/api/rest/search-api.js
//corresponds to /backend/routers/search-router.py

export async function searchTrack(q) {
    const response = await fetch(`/search?q=${encodeURIComponent(q)}`);
    return response.json();
}

export async function searchTrackFull(q) {
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