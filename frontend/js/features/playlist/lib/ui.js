//static/js/features/playlist/lib/ui.js

import { LikeStore } from "../../../cache/LikeStore.js";
import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { TrackStore } from "../../../cache/TrackStore.js";
import { buildNewPlaylist, buildPlaylistContent } from "../../../dom/builders/list.js";
import { 
    buildTrackListItem, 
    buildTrackListEmptyItem, 

    DEFAULT_ACTIONS,
    collapsedHeight
} from "../../../dom/index.js";







/**
 * Adds a new custom playlist element to the DOM with an optional entrance animation.
 *
 * This function handles:
 * - Checking if a playlist with the given `id` already exists (skips if so).
 * - Updating a temporary playlist ID (`tempId`) with the final backend ID if necessary.
 * - Creating a new playlist element using `buildNewPlaylist` if no existing element is found.
 * - Appending the new playlist to the `customPlaylistEl` container.
 * - Applying a simple CSS "fade/slide in" animation by toggling the `hidden` class.
 *
 * @param {HTMLElement} customPlaylistEl - The container element for custom playlists.
 * @param {string} name - The display name of the new playlist.
 * @param {string|number} id - The final ID of the playlist (from backend).
 * @param {string|number|null} [tempId=null] - Optional temporary ID used while waiting for backend confirmation.
 * 
 * @returns {HTMLElement|null} The `.list-track` element inside the new playlist, or `null` if the playlist already exists.
 *
 * @example
 * // Create a new playlist with backend ID
 * const listEl = renderNewCustomPlaylist(customContainerEl, "My Playlist", 42);
 *
 * @example
 * // Create a temporary playlist while awaiting backend ID
 * const listEl = renderNewCustomPlaylist(customContainerEl, "New Playlist", null, "temp-123");
 */
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

    //set initial styles for animation
    playlistEl.classList.add("hidden");

    customPlaylistEl.appendChild(playlistEl);
    
    playlistEl.offsetHeight; //trigger reflow
    playlistEl.classList.remove("hidden");

    const listEl = playlistEl.querySelector(".list-track");
    return listEl;
}


//renders a list of tracks in a playlist
export function renderPlaylist(listEl, tracks, showIndex = true, showDownloadStatus = false, actions = DEFAULT_ACTIONS) { //rename to renderList
    if (!listEl) {
        console.warn("renderPlaylist: list element not found");
        return;
    }
    
    //clear list
    listEl.innerHTML = "";

    //no tracks
    if (!tracks?.length) {
        const item = buildTrackListEmptyItem();
        listEl.appendChild(item);
        return;
    }

    //batch together into a fragment
    const frag = document.createDocumentFragment();

    tracks.forEach((track, index) => {
        const isDownloaded = !!TrackStore.get(track.id);
        console.log("isDownloaded:", isDownloaded);

        const options = {
            showIndex: showIndex,
            index: index,

            showDownloadStatus: showDownloadStatus,
            isDownloaded: isDownloaded,

            actions: actions
        }
        const item = buildTrackListItem(track, options);
        frag.appendChild(item);
    });

    //put into the dom
    listEl.appendChild(frag);
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




//renders a custom playlist by id (just a simple refresh) based on current status in playlistStore
export function renderPlaylistById(id, showIndex = true, showDownloadStatus = false, actions = DEFAULT_ACTIONS) {
    //find playlist with the id
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
    if (!listEl) return; //cancel any rendering operations if no .list-track (hidden)

    let tracks = null;
    switch (id) {
        case "library":
            tracks = TrackStore.getTracks();
            break;
        
        case "liked":
            tracks = LikeStore.getTracks();
            break;

        default:
            tracks = PlaylistStore.getTracks(id);
            break;
    }
    renderPlaylist(listEl, tracks, showIndex, showDownloadStatus, actions); //runs defensively, so it won't do anything if listEl is invalid
}



//state variables for expanding and collapsing
let cachedAvailableHeight = null;
let playlistExpanded = false;

/**
 * Expands a playlist element into a "full view" mode.
 *
 * This function:
 * - Checks that no other playlist is currently expanded.
 * - Marks the playlist as expanded and applies relevant CSS classes.
 * - Calculates the translation needed to move the playlist to the top of its container.
 * - Locks parent scrolling and touch actions to keep the expanded playlist fixed.
 * - Dynamically sets the `.list-track` container height to fill the available space.
 *
 * @param {HTMLElement} titleSearchEl - The title/search bar element to collapse visually.
 * @param {HTMLElement} parentEl - The scrollable parent container of all playlists.
 * @param {HTMLElement} playlistEl - The specific playlist element to expand.
 * @returns {boolean} `true` if expansion succeeded, `false` otherwise.
 */
export function expandPlaylist(titleSearchEl, parentEl, playlistEl) {
    const isExpanded = playlistEl.classList.contains("expanded");
    
    if (isExpanded || playlistExpanded) return false; //do nothing if already expanded or other one is expanded

    playlistExpanded = true;

    //render the other stuff in the playlist
    buildPlaylistContent(playlistEl);
    renderPlaylistById(playlistEl.dataset.id);

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

    //lock parent scrolling in the background
    parentEl.style.overflow = "hidden";
    parentEl.style.touchAction = "none"; //prevent touch scrolling on mobile

    //list track height (only calculated once for performance, consider moving this to bootstrap)
    if (cachedAvailableHeight == null) {
        const style = getComputedStyle(playlistEl);
        const marginBottom = parseFloat(style.marginBottom);

        cachedAvailableHeight = parentRect.bottom - headerEl.offsetHeight - collapsedHeight + marginBottom;
    }

    listTrackEl.style.height = `${cachedAvailableHeight}px`;

    return true;
}


/**
 * Collapses an expanded playlist back into its normal position.
 *
 * This function:
 * - Checks if the playlist is currently expanded.
 * - Removes expansion classes and restores default scrolling/touch behavior.
 * - Resets transforms and list heights to their initial collapsed states.
 *
 * @param {HTMLElement} titleSearchEl - The title/search bar element to re-expand visually.
 * @param {HTMLElement} parentEl - The scrollable parent container of all playlists.
 * @param {HTMLElement} playlistEl - The specific playlist element to collapse.
 * @returns {boolean} `true` if collapse succeeded, `false` otherwise.
 */  
export function collapsePlaylist(titleSearchEl, parentEl, playlistEl) {
    const isExpanded = playlistEl.classList.contains("expanded");

    if (!isExpanded) return false; //do nothing if not expanded

    playlistExpanded = false;
    playlistEl.classList.remove("expanded");

    titleSearchEl.classList.remove("collapsed"); //re-expand title and search bar

    //extract elements
    const listTrackEl = playlistEl.querySelector(".list-track");

    //reset transforms and container styles to allow scrolling
    playlistEl.style.transform = "";

    parentEl.style.overflow = "auto";
    parentEl.style.touchAction = "";

    //list track height
    listTrackEl.style.height = "0px";


    //wait for CSS transition to finish before DOM removal
    const handleTransitionEnd = (event) => {
        if (event.target !== playlistEl) return; //only care about playlist transition end

        //cleanup listener to avoid leaks
        playlistEl.removeEventListener("transitionend", handleTransitionEnd);

        //remove heavy content to minimize memory + rendering cost
        const optionsEl = playlistEl.querySelector(".playlist-options");
        const listTrackEl = playlistEl.querySelector(".list-track");
        if (optionsEl) optionsEl.remove();
        if (listTrackEl) listTrackEl.remove();

        console.log("[collapsePlaylist]: removed hidden DOM nodes after transition");
    };

    //attach transitionend listener
    playlistEl.addEventListener("transitionend", handleTransitionEnd);

    return true
}




/**
 * Removes a playlist element from the DOM with animations.
 *
 * This function first collapses the playlist if it is expanded,
 * waits for the collapse animation to finish, then animates
 * the playlist shrinking and fading out before finally removing
 * it from the DOM. If the playlist is already collapsed, it
 * immediately triggers the shrink/fade animation.
 *
 * @param {string|number} id - The ID of the playlist to remove. Must match the `data-id` attribute.
 * @param {HTMLElement} titleSearchEl - The element containing the search bar/title that may need to expand/collapse.
 * @param {HTMLElement} parentEl - The parent container of the playlist, used for layout adjustments during collapse.
 *
 * @example
 * deleteRenderPlaylistById("5", titleSearchEl, playlistsContainerEl);
 *
 * @remarks
 * - Relies on `collapsePlaylist` to handle the initial collapse animation.
 * - Uses `transitionend` events to sequence animations properly.
 * - Adds a `hidden` class to trigger CSS shrink/fade animation.
 * - Calls `offsetHeight` to force a reflow before starting the shrink/fade.
 */
export function deleteRenderPlaylistById(id, titleSearchEl, parentEl) {
    const playlistEl = document.querySelector(`.playlist[data-id="${id}"]`);
    if (!playlistEl) return;

    const didCollapse = collapsePlaylist(titleSearchEl, parentEl, playlistEl);

    //remove after shrink/fade finishes
    const handleShrinkEnd = (e) => {
        if (e.propertyName !== "opacity") return;
        playlistEl.removeEventListener("transitionend", handleShrinkEnd);
        playlistEl.remove();
    }

    if (didCollapse) {
        //wait for collapse animation
        const handleCollapseEnd = (event) => {
            if (event.propertyName !== "transform") return; //only act on the transform property
            playlistEl.removeEventListener("transitionend", handleCollapseEnd);

            //start shrink and fade
            playlistEl.offsetHeight; //trigger reflow
            playlistEl.classList.add("hidden");

            playlistEl.addEventListener("transitionend", handleShrinkEnd);
        };

        playlistEl.addEventListener("transitionend", handleCollapseEnd);
    } else {
        //already collapsed, just shrink and fade immediately, but this shouldnt really be possible
        playlistEl.offsetHeight; //trigger reflow
        playlistEl.classList.add("hidden");

        playlistEl.addEventListener("transitionend", handleShrinkEnd);
    }
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
