import { createIdStore } from './utils/IdStore.js';
import { TrackStore } from './TrackStore.js';

export const LikeStore = (() => {
    const store = createIdStore();

    return {
        /**
         * Toggle the liked status of a track.
         * If the track is already liked, it is removed from the store.
         * If not liked, it is added.
         *
         * @param {string} id - The track ID to toggle.
         */
        toggle(id) {
            if (store.has(id)) {
                store.remove(id);
            } else {
                store.insert(id);
            }
        },

        
        /**
         * Check if a track is liked.
         *
         * @param {string} trackId - The track ID to check.
         * @returns {boolean} - True if the track is liked, otherwise false.
         */
        has(trackId) {
            return store.has(trackId);
        },

        /**
         * Get all liked track IDs.
         *
         * @returns {string[]} - An array of liked track IDs.
         */
        getIds() {
            return store.getIds();
        },

        /**
         * Get all liked tracks as full track objects.
         * Requires TrackStore to resolve IDs into track objects.
         *
         * @returns {Object[]} - An array of track objects.
         */
        getTracks() {
            return store.getTracks(TrackStore);
        },

        /**
         * Set the liked tracks in bulk.
         * Replaces all current liked tracks with the provided IDs.
         *
         * @param {string[]} ids - An array of track IDs to set as liked.
         */
        setAll(ids) {
            store.setAll(ids);
        },

        /**
         * Clear all liked tracks from the store.
         */
        clear() {
            store.clear();
        },
    };
})();
