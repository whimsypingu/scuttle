//static/js/features/library/lib/api.js
//corresponds to /backend/routers/search-router.py

import { postRequest, getResponse } from "../../../utils/index.js";


export async function getLibraryContent() {
    const response = await getResponse(`/search/?q=`);
    
    const data = await response.json();
    return data;
}

export async function getLikedContent() {
    const response = await getResponse(`/playlists/likes`);

    const data = await response.json();
    return data; 
}

export async function toggleLike(id) {
    const response = await postRequest(`/audio/toggle_like`, { id });
    console.log("toggleLike status:", response.status);    
}


//playlists
export async function getPlaylists() {
    const response = await getResponse(`/playlists`);

    const data = await response.json();
    console.log("getPlaylists:", data.content);
    return data;
}
export async function getPlaylistContent(id) {
    const response = await getResponse(`/playlists/content/?id=${encodeURIComponent(id)}`);

    const data = await response.json();
    console.log(`getPlaylistContent(${id}):`, data.content);
    return data;
}

export async function createPlaylist(tempId, name, importUrl) {
    const response = await postRequest(`/playlists/create`, { "temp_id": tempId, "name": name, "import_url": importUrl });
    console.log("createPlaylist status:", response.status);
}