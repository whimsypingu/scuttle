import { createIdStore } from './utils/IdStore.js';
import { TrackStore } from './TrackStore.js';


export const PlaylistStore = (() => {
    let playlists = {}; // id: {id, name, tracks[createIdStore]}, etc

    return {
        //getters
        /**
         * Get all playlists in the store.
         * @returns {Object.<string, Object>} An object mapping playlist IDs to playlist objects.
         */
        getAll() {
            return playlists;
        },

        /**
         * Get a playlist by its ID.
         * @param {string} id - The ID of the playlist to retrieve.
         * @returns {Object|null} The playlist object if found, otherwise null.
         */
        getPlaylistById(id) {
            return playlists[id] || null;
        },

        
        //modifiers
        /**
         * Create a new playlist and add it to the store.
         * @param {string} id - The unique ID of the new playlist.
         * @param {string} name - The name of the new playlist.
         * @param {Array<string>|null} [trackIds=null] - Optional array of track IDs to initialize the playlist with.
         * @returns {Object} The created playlist object.
         */
        create(id, name, trackIds = null) {
            const tracks = createIdStore();
            if (trackIds) {
                tracks.setAll(trackIds); //sets to list if given
            }
            
            console.log("CREATE:", trackIds, tracks.getIds());
            
            const pl = {
                id,
                name,
                tracks
            };
            playlists[id] = pl;
            return pl;
        },

        /**
         * Update the ID of an existing playlist.
         * @param {string} tempId - The current ID of the playlist.
         * @param {string} newId - The new ID to assign to the playlist.
         * @returns {boolean} True if the update was successful, false if the playlist was not found.
         */        
        updateId(tempId, newId) {
            if (!playlists[tempId]) return false; //not found

            playlists[newId] = playlists[tempId];
            playlists[newId].id = newId; //update ids

            delete playlists[tempId];

            return true;
        },

        /**
         * Update the name of an existing playlist.
         * @param {string} playlistId - The ID of the playlist to rename.
         * @param {string} newName - The new name for the playlist.
         * @returns {boolean} True if the update was successful, false if the playlist was not found.
         */
        editName(playlistId, newName) {
            console.log("[editName] called,", playlistId, newName);
            const pl = playlists[playlistId];
            if (!pl) return false;

            pl.name = newName;
            return true;
        },

        /**
         * Remove a playlist from the store.
         * @param {string} id - The ID of the playlist to remove.
         */
        removePlaylist(id) {
            delete playlists[id];
        },
        
        //helpers
        /**
         * Add a track to a playlist. Overwrites if exists.
         * @param {string} playlistId - The ID of the playlist.
         * @param {string} trackId - The ID of the track to add.
         */
        addTrackId(playlistId, trackId) {
            const pl = playlists[playlistId];
            if (pl) pl.tracks.add(trackId);
        },

        /**
         * Remove a track from a playlist.
         * @param {string} playlistId - The ID of the playlist.
         * @param {string} trackId - The ID of the track to remove.
         */
        removeTrack(playlistId, trackId) {
            const pl = playlists[playlistId];
            if (pl) pl.tracks.remove(trackId);
        },

        /**
         * Remove a track from all playlists in the store.
         * @param {string} trackId - The ID of the track to remove from all playlists.
         * @returns {number} The number of playlists the track was removed from.
         */
        removeTrackFromAll(trackId) {
            let removedCount = 0;
            for (const pl of Object.values(playlists)) {
                if (pl.tracks.has(trackId)) {
                    pl.tracks.remove(trackId);
                    removedCount++;
                }
            }
            return removedCount;
        },

        /**
         * Reorder a track within a playlist by moving it from one index to another.
         * This operation updates the internal track ID order for the specified playlist.
         * 
         * @param {string} playlistId - The ID of the playlist to modify.
         * @param {number} fromIndex - The current 0-based index of the track to move.
         * @param {number} toIndex - The target 0-based index to move the track to (0 would be the first element).
         * @returns {boolean} True if the reorder was successful, false otherwise.
         */
        reorderTrack(playlistId, fromIndex, toIndex) {
            const pl = playlists[playlistId];
            if (!pl) return false;

            return pl.tracks.reorder(fromIndex, toIndex);
        },

        /**
         * Get all track IDs in a playlist.
         * @param {string} playlistId - The ID of the playlist.
         * @returns {Array<string>} An array of track IDs.
         */
        getTrackIds(playlistId) {
            const pl = playlists[playlistId];
            return pl ? pl.tracks.getIds() : [];
        }, 

        /**
         * Get all track objects in a playlist.
         * @param {string} playlistId - The ID of the playlist.
         * @returns {Array<Object>} An array of track objects from TrackStore.
         */
        getTracks(playlistId) {
            const pl = playlists[playlistId];
            return pl ? pl.tracks.getTracks(TrackStore) : [];
        },

        /**
         * Check whether a playlist contains a given track.
         * @param {string} playlistId - The ID of the playlist.
         * @param {string} trackId - The ID of the track.
         * @returns {boolean} True if the track is in the playlist, false otherwise.
         */
        hasTrack(playlistId, trackId) {
            const pl = playlists[playlistId];
            return pl ? pl.tracks.has(trackId) : false;
        },

        /**
         * Get all playlists, with a `checked` flag indicating whether they contain the given track.
         * Useful for rendering checkboxes in the UI.
         * @param {string} trackId - The track ID to check.
         * @returns {Array<{id: string, name: string, checked: boolean}>} 
         * An array of playlist objects with id, name, and checked properties.
         */
        getPlaylistsWithCheck(trackId) { //useful for displaying all playlists with the track in it
            return Object.values(playlists).map(pl => ({
                id: pl.id,
                name: pl.name,
                checked: pl.tracks.has(trackId)
            }));
        }
    };
})();
