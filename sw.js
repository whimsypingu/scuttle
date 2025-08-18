const CACHE_NAME = "audio-cache-v1";
const AUDIO_PATH_PREFIX = "/frontend/audio/stream/";

//console logging on desktop
function swLog(...args) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: "log", msg: args.map(a => String(a)).join(" ") });
        });
    });
}

//install event: optional, can pre-cache static assets if needed
self.addEventListener("install", (event) => {
    swLog("Installing...");
    self.skipWaiting(); //activate immediately
});

self.addEventListener("activate", (event) => {
    swLog("Activating and cleaning old caches...");

    event.waitUntil(
        (async () => {
            //delete old caches
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            swLog("Cache reset on activation");
        })()
    );

    self.clients.claim(); //take control immediately
});


self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    //only intercept /audio/stream requests
    if (url.pathname.startsWith("/audio/stream")) {
        event.respondWith(handleAudioStream(event.request));
    }
});

//handle caching for audio
async function handleAudioStream(request) {
    const cache = await caches.open(CACHE_NAME);

    //1. always fetch and store the full audio
    const fullUrl = new URL(request.url)
    fullUrl.searchParams.set("full", "true");

    //2. store the output
    let arrayBuffer;

    //3. check if request already in cache, otherwise get the cached request
    let cachedResponse = await cache.match(fullUrl);
    if (cachedResponse) {
        arrayBuffer = await cachedResponse.arrayBuffer();
        swLog("Returning cached full audio:", request.url);
    } else {
        const networkResponse = await fetch(fullUrl);
        if (!networkResponse.ok) return networkResponse;

        cachedResponse = networkResponse.clone(); //eats the original so make a copy
        cache.put(fullUrl, cachedResponse);

        arrayBuffer = await networkResponse.arrayBuffer();
        swLog("Cached full audio from network:", fullUrl);
    }

    //4. handle range request, for faster streaming from cache
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
        const bytesMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (bytesMatch) {
            const start = parseInt(bytesMatch[1]);
            const end = bytesMatch[2] ? parseInt(bytesMatch[2]) : arrayBuffer.byteLength - 1;
            const chunk = arrayBuffer.slice(start, end + 1);

            const headers = new Headers({
                "Content-Type": "audio/mpeg",
                "Content-Length": chunk.byteLength,
                "Content-Range": `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
                "Accept-Ranges": "bytes",
            });

            return new Response(chunk, {
                status: 206,
                statusText: "Partial Content",
                headers,
            });
        }
    }

    return new Response(arrayBuffer, {
        status: 200,
        headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": arrayBuffer.byteLength,
            "Accept-Ranges": "bytes",
        },
    });
}

