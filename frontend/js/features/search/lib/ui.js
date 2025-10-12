import { TrackStore } from "../../../cache/TrackStore.js";
import { buildTrackListItem, buildTrackListEmptyItem, SEARCH_ACTIONS, DEFAULT_ACTIONS } from "../../../dom/index.js";

export function showDropdown(searchDropdownEl) {
    searchDropdownEl.classList.remove("hidden"); //css handles height animation
}

export function hideDropdown(searchDropdownEl) {
    searchDropdownEl.classList.add("hidden");
}


let clearInput = false; //handles clearing input

export function setClearInput(status) {
    clearInput = status;
}

export function focusSearchInput(searchInputEl) {
    if (clearInput) {
        searchInputEl.value = "";
    }
    searchInputEl.focus(); //required now to trigger the focus
}

export function unfocusSearchInput(searchInputEl) {
    searchInputEl.blur();
}

export function getTrimmedSearchInput(searchInputEl) {
    return searchInputEl.value.trim();
}



//renders a list of tracks in the ui
export function renderSearchList(searchListEl, tracks) {
    searchListEl.innerHTML = "";

    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        searchListEl.appendChild(item);
        return;
    }

    tracks.forEach((track, index) => {
        const isDownloaded = !!TrackStore.get(track.id);

        let options = {
            showIndex: false,
            index: index,

            showDownloadStatus: true,
            isDownloaded: isDownloaded,

            actions: (isDownloaded ? DEFAULT_ACTIONS : SEARCH_ACTIONS)
        }
        const item = buildTrackListItem(track, options);
        searchListEl.appendChild(item);
    })
}
