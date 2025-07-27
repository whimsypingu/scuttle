//static/js/features/library/ui.js

import { buildTrackListItem } from "../../../dom/index.js";


//renders a list of tracks in the ui
export function renderLibraryList(libraryListEl, tracks) {
    libraryListEl.innerHTML = "";

    if (!tracks?.length) {
        libraryListEl.innerHTML = "<li>No tracks available</li>";
        return;
    }
    
    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track, "library")
        libraryListEl.appendChild(item);
    });
}






