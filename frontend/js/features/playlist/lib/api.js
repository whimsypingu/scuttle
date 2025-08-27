//static/js/features/library/lib/api.js
//corresponds to /backend/routers/search-router.py

import { postRequest, getResponse } from "../../../utils/index.js";


export async function getLibraryContent() {
    const response = await getResponse(`/search/?q=`);
    
    const data = await response.json();
    return data;
}


export async function getLikedContent() {
    const response = await getResponse(`/search/likes`);

    const data = await response.json();
    return data;
}

export async function toggleLike(id) {
    const response = await postRequest(`/audio/toggle_like`, { id });
    console.log("queuePopTrack status:", response.status);    
}