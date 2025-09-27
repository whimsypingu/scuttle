//static/js/features/playlist/lib/utils.js

import { LikeStore } from "../../../cache/LikeStore.js";
import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { TrackStore } from "../../../cache/TrackStore.js";

export function getPlaylistIds(playlistDataset) {
    const playlistIdRaw = playlistDataset.id;
    const playlistId = parseInt(playlistIdRaw, 10);

    if (isNaN(playlistId)) {
        //system playlist
        switch (playlistIdRaw) {
            case "library":
                return TrackStore.getIds(); //TODO: ordering is sus!
            
            case "liked":
                return LikeStore.getIds();

            default:
                console.warn("Unknown system playlist:", playlistIdRaw);
        }
    } else {    
        //user playlist
        return PlaylistStore.getTrackIds(playlistId);
    }
}

export function fisherYatesShuffle(arr) {
    const shuffled = [...arr];

    //ripped from https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}