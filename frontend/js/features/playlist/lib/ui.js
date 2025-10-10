//static/js/features/playlist/lib/ui.js

import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { buildNewPlaylist } from "../../../dom/builders/list.js";
import { 
    buildTrackListItem, 
    buildTrackListEmptyItem, 

    DEFAULT_ACTIONS,
    collapsedHeight
} from "../../../dom/index.js";







//adds a new empty playlist element inside the custom playlists section
export function renderNewCustomPlaylist(customPlaylistEl, name, id, tempId = null) {
    //check if it's already there, then dont do anything
    let existingEl = customPlaylistEl.querySelector(`[data-id="${id}]`);
    if (existingEl) {
        return;
    }

    //try selecting the temp, if it exists, then update the id
    //this is critical segment for being able to call this function and update the tempId with a backend id to ensure
    //all playlist ids are unique
    existingEl = customPlaylistEl.querySelector(`[data-id="${tempId}"]`);
    if (existingEl) {
        existingEl.dataset.id = id;
        return;
    }

    //neither the expected nor the temp id version exists yet
    const idToUse = id ? id : tempId;
    const playlistEl = buildNewPlaylist(name, idToUse);
    customPlaylistEl.appendChild(playlistEl);

    const listEl = playlistEl.querySelector(".list-track");
    return listEl;
}


//renders a list of tracks in a playlist
export function renderPlaylist(listEl, tracks, showIndex = true, actions = DEFAULT_ACTIONS) { //rename to renderList
    listEl.innerHTML = "";

    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        listEl.appendChild(item);
        return;
    }
    
    //handle index check once
    if (showIndex) {
        //build rows
        tracks.forEach((track, index) => {
            const options = {
                showIndex: showIndex,
                index: index,
                actions: actions,
            };
            const item = buildTrackListItem(track, options);
            listEl.appendChild(item);
        });
    } else {
        tracks.forEach((track) => {
            const options = {
                showIndex: showIndex,
                actions: actions,
            };
            const item = buildTrackListItem(track, options);
            listEl.appendChild(item);
        });
    }
}


export function updateAllListTrackItems(trackId, title, artist) {
    const els = document.querySelectorAll(`li[data-track-id="${trackId}"]`);

    //select p.title and set value to payload.content.title, select p.artist and set to payload.content.artist)
    //note: this doesn't update the playbar right away since it's not tied to the id of the audio that is currently playing
    els.forEach(el => {
        const titleEl = el.querySelector("p.title");
        const artistEl = el.querySelector("p.artist");

        if (titleEl) {
            titleEl.textContent = title;
        }

        if (artistEl) {
            artistEl.textContent = artist;
        }
    });
}


// export function deleteAllListTrackItems(trackId) {
//     const els = document.querySelectorAll(`li[data-track-id="${trackId}"]`);

//     els.forEach(el => {
//         el.remove();
//     });
// }



//renders a custom playlist by id (just a simple refresh) based on current status in playlistStore
export function renderPlaylistById(id, showIndex = true, actions = DEFAULT_ACTIONS) {
    const playlistEl = document.querySelector(`.playlist[data-id="${id}"]`);

    console.log("[renderPlaylistById]:", playlistEl);
    if (!playlistEl) return;

    //update playlist title
    const titleEl = playlistEl.querySelector(".list-title");
    const playlist = PlaylistStore.getPlaylistById(id);

    if (titleEl && playlist) {
        titleEl.textContent = playlist.name;
    }

    //update playlist tracks
    const listEl = playlistEl.querySelector(".list-track");
    const tracks = PlaylistStore.getTracks(id);

    renderPlaylist(listEl, tracks, showIndex, actions);
}

export function deleteRenderPlaylistById(id) {
    const playlistEl = document.querySelector(`.playlist[data-id="${id}"]`);
    if (!playlistEl) return;

    //remove expanded class
    //playlistEl.classList.remove("expanded");

    playlistEl.remove();

    // //wait for expanded transition to finish
    // const handleExpandedEnd = (event) => {
    //     if (event.propertyName !== "maxHeight") return;
    //     playlistEl.removeEventListener("transitionend", handleExpandedEnd);

    //     playlistEl.remove();
    // }

    // playlistEl.addEventListener("transitionend", handleExpandedEnd);
}


let cachedAvailableHeight = null;
let playlistExpanded = false;

export function expandPlaylist(titleSearchEl, parentEl, playlistEl) {
    const isExpanded = playlistEl.classList.contains("expanded");
    
    if (isExpanded || (!isExpanded && playlistExpanded)) return false; //do nothing if already expanded or other one is expanded

    playlistExpanded = true;
    playlistEl.classList.add("expanded");

    titleSearchEl.classList.add("collapsed"); //minimize title and search bar

    //extract elements (may be redundant if caller knows them but it's negligible performance damage)
    const headerEl = playlistEl.querySelector(".list-header");
    const listTrackEl = playlistEl.querySelector(".list-track");

    const parentRect = parentEl.getBoundingClientRect();
    const playlistRect = playlistEl.getBoundingClientRect();

    //move to top and style parent
    const translateY = parentRect.top - playlistRect.top;

    playlistEl.style.transform = `translateY(${translateY}px)`;

    parentEl.style.overflow = "hidden";
    parentEl.style.touchAction = "none"; //prevent touch scrolling on mobile

    //list track height
    if (cachedAvailableHeight == null) {
        const style = getComputedStyle(playlistEl);
        const marginBottom = parseFloat(style.marginBottom);

        cachedAvailableHeight = parentRect.bottom - headerEl.offsetHeight - collapsedHeight + marginBottom;
    }

    listTrackEl.style.height = `${cachedAvailableHeight}px`;

    return true;
}


export function collapsePlaylist(titleSearchEl, parentEl, playlistEl) {
    const isExpanded = playlistEl.classList.contains("expanded");

    if (!isExpanded) return false; //do nothing if not expanded

    playlistExpanded = false;
    playlistEl.classList.remove("expanded");

    titleSearchEl.classList.remove("collapsed"); //re-expand title and search bar

    //extract elements
    const listTrackEl = playlistEl.querySelector(".list-track");

    playlistEl.style.transform = "";

    parentEl.style.overflow = "auto";
    parentEl.style.touchAction = "";  // optional, enables touch scrolling on mobile

    //list track height
    listTrackEl.style.height = "0px";

    return true
}





/*
//old events/dom/playlists.js code
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
}*/
