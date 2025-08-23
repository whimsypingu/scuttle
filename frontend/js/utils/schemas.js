// static/js/utils/schemas.js

export async function postRequest(url, body = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`POST ${url} failed: ${response.status}`);
    }

    return response;
}


export async function getResponse(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`GET ${url} failed: ${response.status}`);
    }

    return response;
}