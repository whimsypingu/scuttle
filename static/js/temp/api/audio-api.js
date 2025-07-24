//static/js/api/play-api.js
//corresponds to /backend/api/routers/audio_router.py

import { getResponse } from "./utils.js";


export async function getCurrentAudioStream() {
    const response = await getResponse(`/audio/stream/current`);
    console.log("getCurrentAudioStream status:", response.status);
    const blob = await response.blob();
    return blob
}