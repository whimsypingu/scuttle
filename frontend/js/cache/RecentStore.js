let recentById = {};


/**
 * RecentStore: a singleton for managing all recent search track objects in memory.
 * Tracks are stored by their unique ID.
 */
export const RecentStore = {
    /**
     * Replace all tracks in the store.
     * @param {Array<Object>} tracks - Array of track objects.
     */
    setAll(tracks) {
        recentById = {};
        for (const track of tracks) {
            recentById[track.id] = track;
        }
    },

    /**
     * Insert a single track into the store.
     * If a track with the same ID exists, it will be overwritten.
     * @param {Object} track - The track object to insert. Must have an 'id' property.
     */
    insert(track) {
        recentById[track.id] = track;
    },

    /**
     * Remove a track from the store by its ID.
     * @param {string} id - The ID of the track to remove.
     */    
    remove(id) {
        delete recentById[id];
    },

    /**
     * Get a track by its ID.
     * @param {string} id - The ID of the track to retrieve.
     * @returns {Object|undefined} The track object if found, otherwise undefined.
     */
    get(id) {
        return recentById[id];
    },


    /**
     * Get all track IDs
     * @returns {Array<string>} Array of track IDs.
     */
    getIds() {
        return Object.keys(recentById);
    },


    /**
     * Get multiple tracks by an array of IDs.
     * @param {Array<string>} ids - Array of track IDs.
     * @returns {Array<Object>} Array of track objects that were found. Missing IDs are skipped.
     */
    getMany(ids) {
        return ids.map(id => recentById[id]).filter(Boolean);
    },


    /**
     * Get all track objects currently stored.
     * @returns {Array<Object>} Array of all track objects in the store.
     */
    getTracks() {
        return Object.values(recentById);
    },


    /**
     * Check if a track with the given ID exists in the store.
     * @param {string} id - The track ID to check.
     * @returns {boolean} True if the track exists, false otherwise.
     */
    has(id) {
        return id in recentById;
    },


    /**
     * Clear all tracks from the store.
     */
    clear() {
        recentById = {};
    }
};
