//static/js/ui/library-ui.js

import { $, SELECTORS, buildTrackListItem } from "../dom/index.js";

//renders a list of tracks in the ui
export function renderLibraryList(tracks) {
    const libraryList = $(SELECTORS.library.ids.LIST);
    libraryList.innerHTML = "";

    if (!tracks?.length) {
        libraryList.innerHTML = "<li>No tracks available</li>";
        return;
    }
    
    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track, "library")
        libraryList.appendChild(item);
    });
}






