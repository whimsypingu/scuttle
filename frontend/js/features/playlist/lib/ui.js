//static/js/features/playlist/lib/ui.js

import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { buildNewPlaylist } from "../../../dom/builder.js";
import { 
    buildTrackListItem, 
    buildTrackListEmptyItem, 

    DEFAULT_ACTIONS
} from "../../../dom/index.js";



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
    tracks.forEach((track, index) => {
        const options = {
            index: index,
            actions: DEFAULT_ACTIONS,
        };
        const item = buildTrackListItem(track, options);
        listEl.appendChild(item);
    });
}


export function updateAllListTrackItems(trackId, title, artist) {
    const els = document.querySelectorAll(`li[data-track-id="${trackId}"]`);

    //select p.title and set value to payload.content.title, select p.artist and set to payload.content.artist)
    //note: this doesn't update the playbar right away since it's not tied to the id of the audio that is currently playing
    els.forEach(el => {
        const titleEl = el.querySelector("p.title");
        const artistEl = el.querySelector("p.artist");

        if (titleEl) {
            titleEl.textContent = title;
        }

        if (artistEl) {
            artistEl.textContent = artist;
        }
    });
}


// export function deleteAllListTrackItems(trackId) {
//     const els = document.querySelectorAll(`li[data-track-id="${trackId}"]`);

//     els.forEach(el => {
//         el.remove();
//     });
// }



//renders a custom playlist by id (just a simple refresh) based on current status in playlistStore
export function renderPlaylistById(id) {
    const playlistEl = document.querySelector(`.playlist[data-id="${id}"]`);
    const listEl = playlistEl ? playlistEl.querySelector(".list-track") : null;

    const tracks = PlaylistStore.getTracks(id);

    renderPlaylist(listEl, tracks);
}


