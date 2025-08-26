//static/js/features/library/ui.js

import { buildTrackListItem, buildTrackListEmptyItem } from "../../../dom/index.js";


//renders a list of tracks in the ui
export function renderLibraryList(libraryListEl, tracks) {
    libraryListEl.innerHTML = "";

    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        libraryListEl.appendChild(item);
        return;
    }
    
    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track);
        libraryListEl.appendChild(item);
    });
}





//renders a list of tracks in the ui
export function renderPlaylist(playlistEl, tracks) {
    playlistEl.innerHTML = "";

    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        playlistEl.appendChild(item);
        return;
    }
    
    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track);
        playlistEl.appendChild(item);
    });
}



