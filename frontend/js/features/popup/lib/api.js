import { postRequest, getResponse } from "../../../utils/index.js";

export async function editTrack(id, title, author, playlists) {
    const body = {
        id,
        title,
        author,
        playlists   //array of playlist IDs and checked status
    }
    const response = await postRequest(`/playlists/edit-track`, body);

    console.log("editTrack status:", response.status);    
}
