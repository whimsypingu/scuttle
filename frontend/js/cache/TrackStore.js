let tracksById = {};


/**
 * TrackStore: a singleton for managing all track objects in memory.
 * Tracks are stored by their unique ID.
 * Tracks are of the form: {id, title, artist, duration}
 */
export const TrackStore = {
    /**
     * Replace all tracks in the store.
     * @param {Array<Object>} tracks - Array of track objects.
     */
    setAll(tracks) {
        tracksById = {};
        for (const track of tracks) {
            tracksById[track.id] = track;
        }
    },

    /**
     * Insert a single track into the store.
     * If a track with the same ID exists, it will be overwritten.
     * @param {Object} track - The track object to insert. Must have an 'id' property.
     */
    insert(track) {
        tracksById[track.id] = track;
    },


    /**
     * Updates a track's metadata
     * Given a track ID, merges the provided fields into the existing track.
     * If the track does not exist, nothing happens.
     *
     * @param {string} id - The unique ID of the track to update.
     * @param {Object} fields - An object containing the fields to update.
     * @param {string} [fields.title] - (Optional) The new title of the track.
     * @param {string} [fields.artist] - (Optional) The new artist/uploader of the track.
     * @param {number} [fields.duration] - (Optional) The new duration of the track, in seconds.
     *
     * @example
     * TrackStore.update("YT___abc123", { title: "New Title", artist: "New Artist" });
     */
    update(id, fields) {
        if (tracksById[id]) {
            tracksById[id] = {
                ...tracksById[id],
                ...fields
            };
        }
    },


    /**
     * Remove a track from the store by its ID.
     * @param {string} id - The ID of the track to remove.
     */    
    remove(id) {
        delete tracksById[id];
    },

    /**
     * Get a track by its ID.
     * @param {string} id - The ID of the track to retrieve.
     * @returns {Object|undefined} The track object if found, otherwise undefined.
     */
    get(id) {
        return tracksById[id];
    },


    /**
     * Get all track IDs
     * @returns {Array<string>} Array of track IDs.
     */
    getIds() {
        return Object.keys(tracksById);
    },


    /**
     * Get multiple tracks by an array of IDs.
     * @param {Array<string>} ids - Array of track IDs.
     * @returns {Array<Object>} Array of track objects that were found. Missing IDs are skipped.
     */
    getMany(ids) {
        return ids.map(id => tracksById[id]).filter(Boolean);
    },


    /**
     * Get all track objects currently stored.
     * @returns {Array<Object>} Array of all track objects in the store.
     */
    getTracks() {
        return Object.values(tracksById);
    },


    /**
     * Check if a track with the given ID exists in the store.
     * @param {string} id - The track ID to check.
     * @returns {boolean} True if the track exists, false otherwise.
     */
    has(id) {
        return id in tracksById;
    },


    /**
     * Clear all tracks from the store.
     */
    clear() {
        tracksById = {};
    }
};
