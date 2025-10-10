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
    updateAllListTrackItems
} from "./lib/ui.js";


export {
    getPlaylistData,
    getPlaylistTrackIds,
    fisherYatesShuffle,
} from "./lib/utils.js";



//render specific libraries
import { renderPlaylist } from "./lib/ui.js";

const libraryListEl = $(SELECTORS.library.ids.LIST);
const likedListEl = $(SELECTORS.liked.ids.LIST);

export function renderLibrary() {
    const tracks = TrackStore.getTracks();
    renderPlaylist(libraryListEl, tracks);
}

export function renderLiked() {
    const tracks = LikeStore.getTracks();
    renderPlaylist(likedListEl, tracks);
}