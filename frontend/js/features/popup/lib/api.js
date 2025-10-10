import { postRequest, getResponse } from "../../../utils/index.js";


export async function editPlaylist(id, name) {
    const body = {
        id,
        name,
    }
    const response = await postRequest(`/playlists/edit-playlist`, body);

    console.log("editPlaylist status:", response.status);
}

export async function deletePlaylist(id) {
    const body = {
        id,
    }
    const response = await postRequest(`/playlists/delete-playlist`, body);

    console.log("deletePlaylist status:", response.status);
}


export async function editTrack(id, title, artist, playlists) {
    console.log("PLAYLIST SHAPE", playlists);
    const body = {
        id,
        title,
        artist,
        playlists   //array of {playlist IDs, checked status}
    }
    const response = await postRequest(`/playlists/edit-track`, body);

    console.log("editTrack status:", response.status);    
}


export async function deleteTrack(id) {
    const body = {
        id
    }
    const response = await postRequest(`/playlists/delete-track`, body);

    console.log("deleteTrack status:", response.status);
}