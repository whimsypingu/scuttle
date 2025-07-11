//static/js/api/queue-api.js
//corresponds to /backend/routers/queue-router.py

export async function queueTrack(track) {
    const response = await fetch(`/queue`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track })
    });

    if (!response.ok) {
        throw new Error(`Failed to add to play queue: ${response.status}`);
    }

    console.log("/static/js/api/queue-api/queueTrack status:", response.status)
    return response.json(); //access just mutated queue content through .content
}

export async function queueContents() {
    const response = await fetch(`/queue/contents`);

    if (!response.ok) {
        throw new Error(`Failed to get play queue contents: ${response.status}`);
    }

    console.log("/static/js/api/queue-api/queueContents status:", response.status)
    return response.json(); //access content through .content
}
