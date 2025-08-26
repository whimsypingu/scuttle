import { domEls } from "../../dom/index.js";

import { 
    onClickPlaylist 
} from "../../features/playlist/controller.js";

export function setupPlaylistEventListeners() {
    domEls.playlistsEl.addEventListener("click", (e) => {
        const header = e.target.closest(".list-header");

        if (!header) {
            onClickPlaylist(e, domEls);
            return;
        };

        const playlistEl = header.closest(".playlist");
        const isExpanded = playlistEl.classList.contains("expanded");

        const listTrack = playlistEl.querySelector(".list-track");

        if (!isExpanded) {
            //scroll distance calculation
            const rect = playlistEl.getBoundingClientRect();
            const scrollTop = window.scrollY;
            const offset = rect.top + scrollTop;

            const translateY = -rect.top;
            playlistEl.style.transform = `translateY(${translateY}px)`;

            //lock scroll
            document.body.style.overflowY = "hidden";

            //height
            listTrack.style.height = "100vh"; //for now this is good enough

        } else {
            playlistEl.style.transform = "";

            document.body.style.overflowY = "auto";

            listTrack.style.height = "0px";
        }

        playlistEl.classList.toggle("expanded");
    });
}
