import { buildCreatePlaylistPopup } from "../../dom/builder.js";
import { hidePopup, showPopup } from "./index.js";

import { logDebug } from "../../utils/debug.js";

import { renderNewCustomPlaylist, renderPlaylist } from "../playlist/lib/ui.js";
import { createPlaylist } from "../playlist/lib/api.js";

import { PlaylistStore } from "../../cache/PlaylistStore.js";

export function hidePopupOnClick(e, domEls) {
    const { popupOverlayEl } = domEls;
    if (e.target === popupOverlayEl) hidePopup(popupOverlayEl);
}






export function showEditTrackPopup(domEls) {
    const { popupOverlayEl, popupEl, customPlaylistEl } = domEls;

    //clear old popup and set to a new fresh one
    popupEl.innerHTML = "";

    const newPopupEl = buildEditTrackPopup();
    popupEl.append(newPopupEl);

    //bind listeners
    const cancelButton = newPopupEl.querySelector(".js-cancel");
    cancelButton.addEventListener("click", () => {
        hidePopup(popupOverlayEl);
    });
    
    const createPlaylistButton = newPopupEl.querySelector(".js-create-playlist- ");
    const createPlaylistInputEl = newPopupEl.querySelector(".js-create-playlist-input");

    createPlaylistButton.addEventListener("click", () => {
        logDebug("create playlist triggered"); //more logic here required

        onCreatePlaylist(customPlaylistEl, createPlaylistInputEl); //no await?
        hidePopup(popupOverlayEl);
    })

    //show
    showPopup(popupOverlayEl);
}


export function showCreatePlaylistPopup(domEls) {
    const { popupOverlayEl, popupEl, customPlaylistEl } = domEls;

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

    const createPlaylistButton = newPopupEl.querySelector(".js-create-playlist- ");
    const createPlaylistInputEl = newPopupEl.querySelector(".js-create-playlist-input");

    createPlaylistButton.addEventListener("click", () => {
        logDebug("create playlist triggered"); //more logic here required

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




export function showEditPlaylistPopup(popupOverlayEl) {
    logDebug("fill me in");
}
