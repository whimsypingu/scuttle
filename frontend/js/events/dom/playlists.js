import { playlistDomEls } from "../../dom/index.js";

import { 
    onClickPlaylist 
} from "../../features/playlist/controller.js";
import { togglePlaylist } from "../../features/playlist/index.js";



export function setupPlaylistEventListeners() {
    playlistDomEls.playlistsEl.addEventListener("click", (e) => {

        const headerEl = e.target.closest(".list-header");

        //playlist content is manipulated
        if (!headerEl) {
            onClickPlaylist(e);
            return;
        };

        //playlist is toggled
        const playlistEl = headerEl.closest(".playlist");

        togglePlaylist(playlistEl);
    });
}
