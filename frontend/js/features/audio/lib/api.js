//static/js/features/audio/api.js
//corresponds to /backend/api/routers/audio_router.py

import { getResponse } from "../../../utils/index.js";


export async function getAudioStream(track) {
    try {
        const response = await getResponse(`/audio/stream/${track.id}`);
        console.log("getAudioStream status:", response.status);

        if (!response.ok) {
            console.warn("Failed to get audio stream");
            return null;
        }

        return response; //return the entire Response and dont throw away headers
    } catch (err) {
        console.error("Error fetching audio stream:", err);
        return null;
    }
}