import { LikeStore } from "../../cache/LikeStore.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { $, SELECTORS } from "../../dom/selectors.js";

export {
    getLibraryContent,
    getLikedContent,
    toggleLike,

    createPlaylist,
} from "./lib/api.js";

export {
    renderPlaylist,
    renderNewCustomPlaylist,
    renderPlaylistById,
    deleteRenderPlaylistById,
    updateAllListTrackItems
} from "./lib/ui.js";


export {
    getPlaylistData,
    getPlaylistTrackIds,
    fisherYatesShuffle,
} from "./lib/utils.js";



//render specific libraries
import * as playlistUI from "./lib/ui.js"; 

import { playlistDomEls } from "../../dom/selectors.js";
const { libraryListEl, likedListEl, titleSearchEl, playlistsEl } = playlistDomEls;

export function renderLibrary() {
    const tracks = TrackStore.getTracks();
    playlistUI.renderPlaylist(libraryListEl, tracks);
}

export function renderLiked() {
    const tracks = LikeStore.getTracks();
    playlistUI.renderPlaylist(likedListEl, tracks);
}

//careful with playlistsEl and playlistEl, one is the container
export function expandPlaylist(playlistEl) { return playlistUI.expandPlaylist(titleSearchEl, playlistsEl, playlistEl); }

export function collapsePlaylist(playlistEl) { return playlistUI.collapsePlaylist(titleSearchEl, playlistsEl, playlistEl); }

export function togglePlaylist(playlistEl) { return expandPlaylist(playlistEl) || collapsePlaylist(playlistEl); }
