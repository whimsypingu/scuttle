import { buildCreatePlaylistPopup, buildEditTrackPopup, buildAreYouSurePopup } from "../../dom/builders/popups.js";
import { popupDomEls } from "../../dom/selectors.js";
import { hidePopup, showPopup } from "./index.js";

import { logDebug } from "../../utils/debug.js";

import { renderNewCustomPlaylist, renderPlaylist, renderPlaylistById } from "../playlist/lib/ui.js";
import { createPlaylist } from "../playlist/lib/api.js";

import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { getInputValue, getSelectedPlaylists } from "./lib/utils.js";
import { deleteTrack, editTrack } from "./lib/api.js";
import { showToast } from "../toast/index.js";
import { TrackStore } from "../../cache/TrackStore.js";



const { popupOverlayEl, popupEl, customPlaylistEl } = popupDomEls;



export function hidePopupOnClick(e) {
    if (e.target === popupOverlayEl) hidePopup(popupOverlayEl);
}



//popup to edit which playlists a track is in
export function showEditTrackPopup(trackId) {

    //logic for getting initial checked state
    const playlists = PlaylistStore.getPlaylistsWithCheck(trackId);

    //clear old popup and set to a new fresh one
    popupEl.innerHTML = "";

    const track = TrackStore.get(trackId);
    const newPopupEl = buildEditTrackPopup(playlists, track);
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", () => {
        hidePopup(popupOverlayEl);
    });

    //playlist selection
    const selectionMenuEl = newPopupEl.querySelector(".playlist-selection-menu");
    selectionMenuEl.addEventListener("click", (e) => {
        const optionEl = e.target.closest(".playlist-option");
        if (!optionEl) return;
        optionEl.classList.toggle("checked");
    });


    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", () => {
        logDebug("save triggered"); //more logic here required

        const optionEls = newPopupEl.querySelectorAll(".playlist-option");

        //track metadata
        const trackTitleEl = newPopupEl.querySelector(".js-track-title");
        const trackArtistEl = newPopupEl.querySelector(".js-track-artist");

        onSaveTrackEdits(trackId, optionEls, trackTitleEl, trackArtistEl);

        hidePopup(popupOverlayEl);
    })

    //delete track entirely
    const deleteButtonEl = newPopupEl.querySelector(".js-delete");
    deleteButtonEl.addEventListener("click", () => {
        logDebug("delete triggered");

        onDeleteTrack(trackId);

        hidePopup(popupOverlayEl);
    })

    //show
    showPopup(popupOverlayEl);
}

async function onSaveTrackEdits(trackId, optionEls, titleEl, artistEl) {
    const selections = getSelectedPlaylists(optionEls);

    //optimistic ui updates
    for (const { id, checked } of selections) {
        const inPlaylist = PlaylistStore.hasTrack(id, trackId);

        if (checked && !inPlaylist) {
            //user checked but not in playlist -> add
            PlaylistStore.addTrackId(id, trackId);

            renderPlaylistById(id);
        } else if (!checked && inPlaylist) {
            //user unchecked and in playlist -> remove
            PlaylistStore.removeTrack(id, trackId);

            renderPlaylistById(id);
        }
    }

    //track info
    const trackTitle = getInputValue(titleEl);
    const trackArtist = getInputValue(artistEl);

    // doesn't update track metadata optimistically because 
    // backend needs to check if empty and use original string if necessary
    await editTrack(trackId, trackTitle, trackArtist, selections);
}

async function onDeleteTrack(trackId) {
    await deleteTrack(trackId);
}




//popup for when a new playlist is created
export function showCreatePlaylistPopup() {

    const playlists = PlaylistStore.getAll();

    //clear old popup and set to a new fresh one
    popupEl.innerHTML = "";

    const newPopupEl = buildCreatePlaylistPopup(playlists);
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", () => {
        hidePopup(popupOverlayEl);
    });

    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", async () => {
        const createPlaylistInputEl = newPopupEl.querySelector(".js-create-playlist-input");
        const importPlaylistInputEl = newPopupEl.querySelector(".js-import-playlist-input");

        hidePopup(popupOverlayEl);
        await onCreatePlaylist(customPlaylistEl, createPlaylistInputEl, importPlaylistInputEl); //no await?
    })

    //show
    showPopup(popupOverlayEl);
}

async function onCreatePlaylist(customPlaylistEl, createPlaylistInputEl, importPlaylistInputEl) {
    //if length of input > 0 then 
    // 1) update local playlists, 2) update visuals via playlistUI, 3) send rest call via playlistAPI.
    //listen for websocket update.
    const name = createPlaylistInputEl.value.trim(); //extract and only do stuff if greater than length 0
    const importUrl = importPlaylistInputEl.value.trim();

    if (name.length > 0) {
        logDebug("create playlist triggered");

        const tempId = "tmp-" + crypto.randomUUID();
        PlaylistStore.create(tempId, name);

        const newCustomListEl = renderNewCustomPlaylist(customPlaylistEl, name, null, tempId);
        renderPlaylist(newCustomListEl, []);

        //backend call
        await createPlaylist(tempId, name, importUrl);
    }
}



export function showAreYouSurePopup() {
    return new Promise((resolve) => {
        //clear old popup and set to a new fresh one
        popupEl.innerHTML = "";

        const newPopupEl = buildAreYouSurePopup();
        popupEl.append(newPopupEl);

        //bind listeners
        const cancelButton = newPopupEl.querySelector(".js-cancel");
        cancelButton.addEventListener("click", () => {
            hidePopup(popupOverlayEl);
            popupEl.innerHTML = "";
            resolve(false);
        });

        const saveButtonEl = newPopupEl.querySelector(".js-save");
        saveButtonEl.addEventListener("click", async () => {
            hidePopup(popupOverlayEl);
            popupEl.innerHTML = "";
            resolve(true);
        })

        //show
        showPopup(popupOverlayEl);
    });
}
