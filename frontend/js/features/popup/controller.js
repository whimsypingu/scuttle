import { buildCreatePlaylistPopup, buildEditTrackPopup } from "../../dom/builder.js";
import { popupDomEls } from "../../dom/selectors.js";
import { hidePopup, showPopup } from "./index.js";

import { logDebug } from "../../utils/debug.js";

import { renderNewCustomPlaylist, renderPlaylist, renderPlaylistById } from "../playlist/lib/ui.js";
import { createPlaylist } from "../playlist/lib/api.js";

import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { getSelectedPlaylists } from "./lib/utils.js";
import { editTrack } from "./lib/api.js";

export function hidePopupOnClick(e, domEls) {
    const { popupOverlayEl } = domEls;
    if (e.target === popupOverlayEl) hidePopup(popupOverlayEl);
}



//popup to edit which playlists a track is in
export function showEditTrackPopup(domEls, trackId) {
    const { popupOverlayEl, popupEl, customPlaylistEl } = popupDomEls;

    //TODO: need some other logic here for getting initial checked state
    const playlists = PlaylistStore.getPlaylistsWithCheck(trackId);

    //clear old popup and set to a new fresh one
    popupEl.innerHTML = "";

    const newPopupEl = buildEditTrackPopup(playlists);
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", () => {
        hidePopup(popupOverlayEl);
    });

    const selectionMenuEl = newPopupEl.querySelector(".playlist-selection-menu");
    selectionMenuEl.addEventListener("click", (e) => {
        const optionEl = e.target.closest(".playlist-option");
        if (!optionEl) return;
        optionEl.classList.toggle("checked");
    });

    const saveButtonEl = newPopupEl.querySelector(".js-save");
    saveButtonEl.addEventListener("click", () => {
        logDebug("save playlist triggered"); //more logic here required

        const optionEls = newPopupEl.querySelectorAll(".playlist-option");
        onSaveTrackEdits(trackId, optionEls);

        hidePopup(popupOverlayEl);
    })

    //show
    showPopup(popupOverlayEl);
}

async function onSaveTrackEdits(trackId, optionEls) {
    const selections = getSelectedPlaylists(optionEls);

    //optimistic ui update
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

    await editTrack(trackId, "", "", selections);
}





//popup for when a new playlist is created
export function showCreatePlaylistPopup(domEls) {
    const { popupOverlayEl, popupEl, customPlaylistEl } = popupDomEls;

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
    saveButtonEl.addEventListener("click", () => {
        logDebug("create playlist triggered"); //more logic here required

        const createPlaylistInputEl = newPopupEl.querySelector(".js-create-playlist-input");

        onCreatePlaylist(customPlaylistEl, createPlaylistInputEl); //no await?
        hidePopup(popupOverlayEl);
    })

    //show
    showPopup(popupOverlayEl);
}

async function onCreatePlaylist(customPlaylistEl, createPlaylistInputEl) {
    //if length of input > 0 then 
    // 1) update local playlists, 2) update visuals via playlistUI, 3) send rest call via playlistAPI.
    //listen for websocket update.    
    const name = createPlaylistInputEl.value.trim(); //extract and only do stuff if greater than length 0
    if (name.length > 0) {
        const tempId = "tmp-" + crypto.randomUUID();
        PlaylistStore.create(tempId, name);

        const newCustomListEl = renderNewCustomPlaylist(customPlaylistEl, name, null, tempId);
        renderPlaylist(newCustomListEl, []);

        await createPlaylist(tempId, name);
    }
}




// export function showEditPlaylistPopup(domEls) {
//     const { popupOverlayEl, popupEl, customPlaylistEl } = domEls;

//     const playlists = PlaylistStore.getAll();

//     //clear old popup and set to a new fresh one
//     popupEl.innerHTML = "";

//     const newPopupEl = buildEditTrackPopup(playlists);
//     popupEl.append(newPopupEl);

//     //bind listeners
//     const cancelButton = newPopupEl.querySelector(".js-cancel");
//     cancelButton.addEventListener("click", () => {
//         hidePopup(popupOverlayEl);
//     });

//     const selectionMenuEl = newPopupEl.querySelector(".playlist-selection-menu");
//     selectionMenuEl.addEventListener("click", (e) => {
//         const optionEl = e.target.closest(".playlist-option");
//         if (!optionEl) return;
//         optionEl.classList.toggle("checked");
//     });

//     const saveButtonEl = newPopupEl.querySelector(".js-save");

//     createPlaylistButton.addEventListener("click", () => {
//         logDebug("create playlist triggered"); //more logic here required

//         onSavePlaylist(customPlaylistEl, createPlaylistInputEl); //no await?
//         hidePopup(popupOverlayEl);
//     })

//     //show
//     showPopup(popupOverlayEl);
// }}
