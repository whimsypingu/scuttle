//static/js/features/library/ui.js

import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { buildNewPlaylist } from "../../../dom/builder.js";
import { buildTrackListItem, buildTrackListEmptyItem } from "../../../dom/index.js";


//adds a new empty playlist element inside the custom playlists section
export function renderNewCustomPlaylist(customPlaylistEl, name, id, tempId = null) {
    //check if it's already there, then dont do anything
    let existingEl = customPlaylistEl.querySelector(`[data-id="${id}]`);
    if (existingEl) {
        return;
    }

    //try selecting the temp, if it exists, then update the id
    //this is critical segment for being able to call this function and update the tempId with a backend id to ensure
    //all playlist ids are unique
    existingEl = customPlaylistEl.querySelector(`[data-id="${tempId}"]`);
    if (existingEl) {
        existingEl.dataset.id = id;
        return;
    }

    //neither the expected nor the temp id version exists yet
    const idToUse = id ? id : tempId;
    const playlistEl = buildNewPlaylist(name, idToUse);
    customPlaylistEl.appendChild(playlistEl);

    const listEl = playlistEl.querySelector(".list-track");
    return listEl;
}


//renders a list of tracks in a playlist
export function renderPlaylist(listEl, tracks) { //rename to renderList
    listEl.innerHTML = "";

    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        listEl.appendChild(item);
        return;
    }
    
    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track);
        listEl.appendChild(item);
    });
}


//renders a custom playlist by id (just a simple refresh) based on current status in playlistStore
export function renderPlaylistById(id) {
    const playlistEl = document.querySelector(`.playlist[data-id="${id}"]`);
    const listEl = playlistEl ? playlistEl.querySelector(".list-track") : null;

    const tracks = PlaylistStore.getTracks(id);

    renderPlaylist(listEl, tracks);
}