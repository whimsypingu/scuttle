

let localPlaylists = []; // each playlist will be {id, name, tracks[]}

export function getPlaylistById(id) {
    return localPlaylists.find(p => p.id === id) || null;
}


export function setLocalPlaylists(playlists) {
    localPlaylists = playlists;
}

export function setSingleLocalPlaylist(playlist) {
    const { id, name } = playlist;
    
}


export function createLocalPlaylist(id, name) {
    const newPlaylist = {
        "id": id,
        "name": name,
        "tracks": [],
    };

    localPlaylists.push(newPlaylist);
}

export function updatePlaylistId(tempId, newId) {
    const playlist = localPlaylists.find(p => p.id === tempId);
    if (playlist) {
        playlist.id = newId;
        return true; //updated
    }
    return false; //no match found
}
