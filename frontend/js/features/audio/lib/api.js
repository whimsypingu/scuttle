//static/js/features/audio/api.js
//corresponds to /backend/api/routers/audio_router.py

import { getResponse } from "../../../utils/index.js";


export async function getAudioStream(trackId) {
    const response = await fetch(`/audio/stream/${trackId}`);
    console.log("getAudioStream status:", response.status);

    if (!response) return null;

    //log and handle 503
    if (response.status === 503) {
        console.warn("Failed to get audio stream, probably downloading");
    }

    return response;
}