//static/js/api/rest/download-api.js
//corresponds to /backend/routers/download-router.py

export async function downloadTrack(track) {
    const response = await fetch(`/download`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track })
    });

    if (!response.ok) {
        throw new Error(`Failed to add to download queue: ${response.status}`);
    }

    console.log("/static/js/api/download-api/downloadTrack status:", response.status)
    return;
}

export async function downloadContents() {
    const response = await fetch(`/download/contents`);

    if (!response.ok) {
        throw new Error(`Failed to get download queue contents: ${response.status}`);
    }

    console.log("/static/js/api/download-api/downloadContents status:", response.status)
    return response.json(); //access content through .content
}
