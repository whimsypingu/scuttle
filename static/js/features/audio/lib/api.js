//static/js/features/audio/api.js
//corresponds to /backend/api/routers/audio_router.py

import { getResponse } from "../../../utils/index.js";



export async function getCurrentAudioStream() {
    try {
        const response = await getResponse(`/audio/stream/current`);
        console.log("getCurrentAudioStream status:", response.status);

        if (response.status === 204) return null; //edge case when queue is exhausted and no tracks left
        if (!response.ok) {
            console.warn("Failed to get audio stream");
            return null;
        }

        return await response.blob();
    } catch (err) {
        console.error("Error fetching current audio stream:", err);
        return null;
    }
}