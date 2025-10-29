//static/js/features/playlist/lib/utils.js

import { LikeStore } from "../../../cache/LikeStore.js";
import { PlaylistStore } from "../../../cache/PlaylistStore.js";
import { QueueStore } from "../../../cache/QueueStore.js";
import { TrackStore } from "../../../cache/TrackStore.js";


/**
 * Extracts the numeric playlist ID from a playlist dataset.
 * 
 * Converts the `id` property of the given playlist dataset to an integer.
 * If the `id` cannot be parsed as a number, `NaN` will be returned.
 * 
 * Note: Add more extractors if necessary in the future here, like additional fields besides just id.
 * 
 * @param {Object} playlistDataset - The dataset object representing a playlist.
 * @param {string} playlistDataset.id - The playlist ID, string like 'library' or '5'.
 * @returns {string} The playlist ID
 * 
 * @example
 * getPlaylistData({ id: "5" });   // returns 5
 * getPlaylistData({ id: "library" }); // returns "library"
 */
export function getPlaylistData(playlistDataset) {
    const playlistId = playlistDataset.id;

    return {
        playlistId
    };
}





/**
 * Get an array of track IDs from a playlist dataset.
 * 
 * Supports both system playlists (like "library" or "liked") and user playlists.
 * 
 * @param {Object} playlistDataset - The dataset object representing a playlist.
 * @param {string} playlistDataset.id - The ID of the playlist. 
 *        Can be a number in string format (user playlist) or a string (system playlist: "library", "liked").
 * @returns {Array<string>} Array of track IDs in the playlist.
 * @throws Will log a warning for unknown system playlists.
 * 
 * @example
 * getPlaylistTrackIds({ id: "library" }); // returns all track IDs from TrackStore
 * getPlaylistTrackIds({ id: "5" });        // returns track IDs from user playlist 5
 */
export function getPlaylistTrackIds(playlistDataset) {
    const playlistId = playlistDataset.id;

    switch (playlistId) {
        case "library":
            return TrackStore.getIds(); //TODO: ordering is sus!
            
        case "liked":
            return LikeStore.getIds();

        case "queue":
            return QueueStore.getIds();

        default:
            //user playlist
            return PlaylistStore.getTrackIds(playlistId);
    }
}




/**
 * Shuffle an array using the Fisher–Yates (aka Knuth) shuffle algorithm.
 * 
 * Produces a new array with the elements randomly reordered.
 * 
 * @param {Array} arr - The array to shuffle.
 * @returns {Array} A new shuffled array; the original array is not mutated.
 * 
 * @example
 * fisherYatesShuffle([1, 2, 3, 4]);
 * // might return [3, 1, 4, 2]
 */
export function fisherYatesShuffle(arr) {
    const shuffled = [...arr];

    //ripped from https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}