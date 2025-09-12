import { domEls } from "../../dom/index.js";

import { 
    onClickPlaylist 
} from "../../features/playlist/controller.js";

export function setupPlaylistEventListeners() {
    domEls.playlistsEl.addEventListener("click", (e) => {
        const headerEl = e.target.closest(".list-header");

        if (!headerEl) {
            onClickPlaylist(e, domEls);
            return;
        };

        const playlistEl = headerEl.closest(".playlist");
        const isExpanded = playlistEl.classList.contains("expanded");

        const listTrack = playlistEl.querySelector(".list-track");

        const parentEl = document.getElementById("playlists");

        if (!isExpanded) {
            const parentRect = parentEl.getBoundingClientRect();
            const playlistRect = playlistEl.getBoundingClientRect();

            //
            const translateY = parentRect.top - playlistRect.top;

            playlistEl.style.transform = `translateY(${translateY}px)`;

            parentEl.style.overflow = "hidden";
            parentEl.style.touchAction = "none";  // optional, prevents touch scrolling on mobile

            //
            const availableHeight = parentRect.height - headerEl.offsetHeight;
            listTrack.style.height = `${availableHeight}px`;

        } else {
            playlistEl.style.transform = "";

            parentEl.style.overflow = "auto";
            parentEl.style.touchAction = "";  // optional, prevents touch scrolling on mobile

            listTrack.style.height = "0px";
        }

        playlistEl.classList.toggle("expanded");
    });
}
