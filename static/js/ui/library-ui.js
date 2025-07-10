//static/js/ui/library-ui.js

import { SELECTORS, $ } from "../dom/selectors.js";
import { buildTrackListItem } from "../dom/builder.js";

//renders a list of tracks in the ui
export function renderLibraryList(tracks) {
    const libraryList = $(SELECTORS.library.ids.LIST);
    libraryList.innerHTML = "";

    if (!tracks?.length) return;

    //build rows
    tracks.forEach(track => {
        const item = buildTrackListItem(track, "library")
        libraryList.appendChild(item);
    });
}






