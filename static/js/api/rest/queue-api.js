//static/js/api/rest/queue-api.js
//corresponds to /backend/routers/queue-router.py

export async function queueTrack(track) {
    const response = await fetch(`/queue`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track }) //see /backend/data_structures/schemas/rest_schemas.py
    });

    if (!response.ok) {
        throw new Error(`Failed to add to play queue: ${response.status}`);
    }

    console.log("/static/js/api/rest/queue-api/queueTrack status:", response.status);
    return response.json(); //does nothing tbh
}

export async function queueNowTrack(track) {
    const response = await fetch(`/queue/now`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ track }) //see /backend/data_structures/schemas/rest_schemas.py
    });

    if (!response.ok) {
        throw new Error(`Failed to add tp beginning of play queue: ${response.status}`);
    }

    console.log("/static/js/api/rest/queue-api/queueNowTrack status:", response.status);
    return response.json();
}

export async function removeTrack(index = 0) {
    const response = await fetch(`/queue/remove`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ index })
    });

    if (!response.ok) {
        throw new Error(`Failed to remove from play queue at index ${index}: ${response.status}`)
    }

    console.log("/static/js/api/rest/queue-api/removeTrack status:", response.status);
    return response.json();
}

export async function queueContents() {
    const response = await fetch(`/queue/contents`);

    if (!response.ok) {
        throw new Error(`Failed to get play queue contents: ${response.status}`);
    }

    console.log("/static/js/api/rest/queue-api/queueContents status:", response.status);
    return response.json(); //access content through .content
}
