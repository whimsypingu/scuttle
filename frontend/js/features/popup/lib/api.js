import { postRequest, getResponse } from "../../../utils/index.js";


/**
 * Sends a request to update the name of an existing playlist.
 *
 * @param {string} id - The ID of the playlist to edit.
 * @param {string} name - The new name for the playlist.
 *
 * @returns {Promise<void>} Resolves when the request completes.
 */
export async function editPlaylist(id, name) {
    const body = {
        id,
        name
    }

    console.log("Editing playlist:", { id, name });

    const response = await postRequest(`/playlists/edit-playlist`, body);

    console.log("editPlaylist status:", response.status);
}


/**
 * Sends a request to delete a playlist by ID.
 *
 * @param {string} id - The ID of the playlist to delete.
 *
 * @returns {Promise<void>} Resolves when the request completes.
 */
export async function deletePlaylist(id) {
    const body = {
        id,
    }
    const response = await postRequest(`/playlists/delete-playlist`, body);

    console.log("deletePlaylist status:", response.status);
}


/**
 * Sends a request to update a track's metadata and playlist memberships.
 *
 * @param {string} id - The ID of the track to edit.
 * @param {string} title - The new title for the track.
 * @param {string} artist - The new artist for the track.
 * @param {Array<{id: string, checked: boolean}>} playlists - An array describing the track's playlist memberships.
 * Each object should contain:
 *   - `id`: The playlist ID (as a string)
 *   - `checked`: Whether the track should be present in the playlist.
 *
 * @returns {Promise<void>} Resolves when the request completes.
 */
export async function editTrack(id, title, artist, playlists) {
    console.log("PLAYLIST SHAPE", playlists);
    const body = {
        id,
        title,
        artist,
        playlists   //array of {playlist IDs, checked status}
    }
    console.log(body);
    const response = await postRequest(`/playlists/edit-track`, body);

    console.log("editTrack status:", response.status);    
}


/**
 * Sends a request to delete a track by ID.
 *
 * @param {string} id - The ID of the track to delete.
 *
 * @returns {Promise<void>} Resolves when the request completes.
 */
export async function deleteTrack(id) {
    const body = {
        id
    }
    const response = await postRequest(`/playlists/delete-track`, body);

    console.log("deleteTrack status:", response.status);
}