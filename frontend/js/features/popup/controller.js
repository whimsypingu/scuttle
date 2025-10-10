import { buildCreatePlaylistPopup, buildEditTrackPopup, buildAreYouSurePopup, buildEditPlaylistPopup } from "../../dom/builders/popups.js";
import { popupDomEls } from "../../dom/selectors.js";
import { hidePopup, showPopup } from "./index.js";

import { logDebug } from "../../utils/debug.js";

import { renderNewCustomPlaylist, renderPlaylist, renderPlaylistById } from "../playlist/lib/ui.js";
import { createPlaylist } from "../playlist/lib/api.js";

import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { getInputValue, getSelectedPlaylists } from "./lib/utils.js";
import { editPlaylist, deletePlaylist, editTrack, deleteTrack } from "./lib/api.js";
import { showToast } from "../toast/index.js";
import { TrackStore } from "../../cache/TrackStore.js";



const { popupOverlayEl, popupEl, customPlaylistEl } = popupDomEls;


/**
 * Hides the popup overlay when clicking outside the popup content.
 * Intended to be used as an event listener for click events on the overlay.
 *
 * @param {MouseEvent} e - The click event.
 * @returns {Promise<void>}
 *
 * Usage:
 * popupOverlayEl.addEventListener('click', hidePopupOnClick);
 */
export async function hidePopupOnClick(e) {
    if (e.target === popupOverlayEl) await hidePopup();
}




/**
 * Shows a "Are you sure?" confirmation popup.
 * Returns a Promise that resolves to true if user confirms, false if canceled.
 * see frontend/js/dom/builders/popups.js for options
 * 
 * @param {Object} options - Optional configuration for the popup.
 * @param {string} options.message - The message to display in the popup.
 * @param {string} options.saveText - Text for the save/confirm button.
 * @param {string} options.cancelText - Text for the cancel button.
 * @returns {Promise<boolean>} - Resolves to true if user confirms, false otherwise.
 *
 * Usage: 
 * const confirmed = await showAreYouSurePopup({ message: "Delete track?" });
 */
export function showAreYouSurePopup(options = {}) {
    return new Promise((resolve) => {
        const newPopupEl = buildAreYouSurePopup(options);
        popupEl.append(newPopupEl);

        //bind listeners
        const cancelButton = newPopupEl.querySelector(".js-cancel");
        cancelButton.addEventListener("click", async () => {
            await hidePopup();
            resolve(false);
        });

        const saveButtonEl = newPopupEl.querySelector(".js-save");
        saveButtonEl.addEventListener("click", async () => {
            await hidePopup();
            resolve(true);
        });

        //show
        showPopup(popupOverlayEl);
    });
}




/**
 * Shows a popup for editing a playlist.
 *
 * The popup allows the user to:
 *  - Edit the playlist's name
 *  - Delete the playlist (with confirmation)
 *  - Save or cancel changes
 *
 * Event listeners are bound to handle the respective actions.
 *
 * @param {string} playlistId - The ID of the playlist to edit.
 *
 * @example
 * showEditPlaylistPopup("123");
 */
export function showEditPlaylistPopup(playlistId) {
    const playlist = PlaylistStore.getPlaylistById(playlistId);

    const newPopupEl = buildEditPlaylistPopup(playlist);
    popupEl.append(newPopupEl);
    
    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", async () => {
        await hidePopup();
    });

    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", async () => {
        logDebug("save triggered"); //more logic here required

        //playlist metadata
        const playlistNameEl = newPopupEl.querySelector(".js-playlist-name");

        await hidePopup();

        onSavePlaylistEdits(playlistId, playlistNameEl);
    });

    //delete track entirely
    const deleteButtonEl = newPopupEl.querySelector(".js-delete");
    deleteButtonEl.addEventListener("click", async () => {
        logDebug("delete triggered");

        await hidePopup();
        
        const options = {
            saveText: "Yes",
        }
        const confirmed = await showAreYouSurePopup(options);
        if (confirmed) {
            await deletePlaylist(playlistId);
            await hidePopup();
        }
    })

    //show
    showPopup(popupOverlayEl);
}


/**
 * Handles saving edits to a playlist.
 *
 * Extracts the updated playlist name from the input element
 * and sends it to the backend via `editPlaylist`.
 *
 * Note: Does **not** update the local `PlaylistStore` optimistically; 
 *       the store is updated after backend confirmation.
 *
 * @param {string} playlistId - The ID of the playlist to update.
 * @param {HTMLInputElement} playlistNameEl - The input element containing the new playlist name.
 *
 * @returns {Promise<void>}
 */
async function onSavePlaylistEdits(playlistId, playlistNameEl) {

    //playlist info
    const playlistName = getInputValue(playlistNameEl);

    // doesn't update playlist metadata optimistically because 
    // backend needs to check if empty and use original string if necessary
    await editPlaylist(playlistId, playlistName);
}





/**
 * Shows a popup to edit which playlists a track belongs to.
 * Includes functionality for editing metadata, toggling playlists, and deleting the track.
 *
 * @param {string} trackId - The ID of the track to edit.
 *
 * Usage:
 * showEditTrackPopup(track.id);
 */
export function showEditTrackPopup(trackId) {

    //logic for getting initial checked state
    const playlists = PlaylistStore.getPlaylistsWithCheck(trackId);    

    const track = TrackStore.get(trackId);
    const newPopupEl = buildEditTrackPopup(playlists, track);
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", async () => {
        await hidePopup();
    });

    //playlist selection
    const selectionMenuEl = newPopupEl.querySelector(".playlist-selection-menu");
    selectionMenuEl.addEventListener("click", (e) => {
        const optionEl = e.target.closest(".playlist-option");
        if (!optionEl) return;
        optionEl.classList.toggle("checked");
    });


    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", async () => {
        logDebug("save triggered"); //more logic here required

        const optionEls = newPopupEl.querySelectorAll(".playlist-option");

        //track metadata
        const trackTitleEl = newPopupEl.querySelector(".js-track-title");
        const trackArtistEl = newPopupEl.querySelector(".js-track-artist");

        await hidePopup();

        onSaveTrackEdits(trackId, optionEls, trackTitleEl, trackArtistEl);
    });

    //delete track entirely
    const deleteButtonEl = newPopupEl.querySelector(".js-delete");
    deleteButtonEl.addEventListener("click", async () => {
        logDebug("delete triggered");

        await hidePopup();
        
        const options = {
            saveText: "Yes",
        }
        const confirmed = await showAreYouSurePopup(options);
        if (confirmed) {
            await deleteTrack(trackId);
            await hidePopup();
        }
    })

    //show
    showPopup(popupOverlayEl);
}


/**
 * Handles saving changes to track playlists and metadata.
 * Updates local cache optimistically, renders UI updates, and calls backend API.
 *
 * @param {string} trackId - The ID of the track to update.
 * @param {NodeList} optionEls - NodeList of playlist option elements with 'checked' state.
 * @param {HTMLInputElement} titleEl - Input element for track title.
 * @param {HTMLInputElement} artistEl - Input element for track artist.
 */
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





/**
 * Shows a popup to create a new playlist.
 * Handles playlist creation, import URL, and UI updates.
 */
export function showCreatePlaylistPopup() {
    console.log("[showCreatePlaylistPopup] triggered");
    const playlists = PlaylistStore.getAll();

    const newPopupEl = buildCreatePlaylistPopup(playlists);
    popupEl.append(newPopupEl);

    popupOverlayEl.offsetHeight;

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", async () => {
        console.log("[showCreatePlaylistPopup] canceled");
        await hidePopup();
    });

    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", async () => {
        console.log("[showCreatePlaylistPopup] saved");
        const createPlaylistInputEl = newPopupEl.querySelector(".js-create-playlist-input");
        const importPlaylistInputEl = newPopupEl.querySelector(".js-import-playlist-input");

        await hidePopup();

        await onCreatePlaylist(customPlaylistEl, createPlaylistInputEl, importPlaylistInputEl); //no await?
    })

    //show
    showPopup(popupOverlayEl);

    console.log("[showCreatePlaylistPopup] content:", popupEl);

}

/**
 * Handles creating a new playlist: updates local cache, renders UI, and calls backend.
 *
 * @param {HTMLElement} customPlaylistEl - Container element for custom playlists.
 * @param {HTMLInputElement} createPlaylistInputEl - Input element for new playlist name.
 * @param {HTMLInputElement} importPlaylistInputEl - Input element for import URL (optional).
 */
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

