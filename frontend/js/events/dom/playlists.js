import { collapsedHeight, domEls, searchDomEls } from "../../dom/index.js";

import { 
    onClickPlaylist 
} from "../../features/playlist/controller.js";



let cachedAvailableHeight = null;

export function setupPlaylistEventListeners() {
    domEls.playlistsEl.addEventListener("click", (e) => {
        const headerEl = e.target.closest(".list-header");

        //playlist content is manipulated
        if (!headerEl) {
            onClickPlaylist(e);
            return;
        };

        //playlist is toggled
        const playlistEl = headerEl.closest(".playlist");
        const isExpanded = playlistEl.classList.contains("expanded");

        //expand heights of playlist option buttons and tracklist
        const playlistOptionsEl = playlistEl.querySelector(".playlist-options");
        const listTrackEl = playlistEl.querySelector(".list-track");

        const parentEl = document.getElementById("playlists");

        playlistEl.classList.toggle("expanded");
        if (!isExpanded) {

            //shrink title search bar
            searchDomEls.titleSearchEl.classList.add("collapsed");

            const parentRect = parentEl.getBoundingClientRect();
            const playlistRect = playlistEl.getBoundingClientRect();

            //move to top and style parent
            const translateY = parentRect.top - playlistRect.top;

            playlistEl.style.transform = `translateY(${translateY}px)`;

            parentEl.style.overflow = "hidden";
            parentEl.style.touchAction = "none";  // optional, prevents touch scrolling on mobile

            //list options height
            const optionHeight = playlistOptionsEl.scrollHeight;
            //playlistOptionsEl.style.height = `${optionHeight}px`;

            //list track height
            if (cachedAvailableHeight == null) {
                const style = getComputedStyle(playlistEl); //slight nudging to make it look nice
                const marginBottom = parseFloat(style.marginBottom);
                //console.log("MARGINBOTTOM:", marginBottom);
                cachedAvailableHeight = parentRect.bottom - headerEl.offsetHeight - collapsedHeight + marginBottom;
            }

            // console.log("PARENTRECT.BOTTOM:", parentRect.bottom);
            // console.log("PLAYLISTOPTIONSEL.HEIGHT:", playlistOptionsEl.offsetHeight);
            // console.log("HEADEREL.HEIGHT:", headerEl.offsetHeight);
            // console.log("AVAILABLE HEIGHT:", cachedAvailableHeight);
            listTrackEl.style.height = `${cachedAvailableHeight}px`;

        } else {
            //re-expand title search bar
            searchDomEls.titleSearchEl.classList.remove("collapsed");

            playlistEl.style.transform = "";

            parentEl.style.overflow = "auto";
            parentEl.style.touchAction = "";  // optional, enables touch scrolling on mobile

            //list options height
            // playlistOptionsEl.style.height = "0px";

            //list track height
            listTrackEl.style.height = "0px";
        }

    });
}
