import { domEls } from "../../dom/index.js";

import { 
    onClickPlaylist 
} from "../../features/playlist/controller.js";

export function setupPlaylistEventListeners() {
    domEls.playlistsEl.addEventListener("click", (e) => {
        const headerEl = e.target.closest(".list-header");

        if (!headerEl) {
            onClickPlaylist(e);
            return;
        };

        const playlistEl = headerEl.closest(".playlist");
        const isExpanded = playlistEl.classList.contains("expanded");

        //expand heights of playlist option buttons and tracklist
        const playlistOptionsEl = playlistEl.querySelector(".playlist-options");
        const listTrackEl = playlistEl.querySelector(".list-track");

        const parentEl = document.getElementById("playlists");

        if (!isExpanded) {
            const parentRect = parentEl.getBoundingClientRect();
            const playlistRect = playlistEl.getBoundingClientRect();

            //move to top and style parent
            const translateY = parentRect.top - playlistRect.top;

            playlistEl.style.transform = `translateY(${translateY}px)`;

            parentEl.style.overflow = "hidden";
            parentEl.style.touchAction = "none";  // optional, prevents touch scrolling on mobile

            //list options height
            const optionHeight = playlistOptionsEl.scrollHeight;
            playlistOptionsEl.style.height = `${optionHeight}px`;

            //list track height
            const availableHeight = parentRect.height - optionHeight - headerEl.offsetHeight;
            listTrackEl.style.height = `${availableHeight}px`;

        } else {
            playlistEl.style.transform = "";

            parentEl.style.overflow = "auto";
            parentEl.style.touchAction = "";  // optional, prevents touch scrolling on mobile

            //list options height
            playlistOptionsEl.style.height = "0px";

            //list track height
            listTrackEl.style.height = "0px";
        }

        playlistEl.classList.toggle("expanded");
    });
}
