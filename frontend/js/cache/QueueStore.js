import { createIdStore } from './utils/IdStore.js';
import { TrackStore } from './TrackStore.js';

export const QueueStore = (() => {
    const store = createIdStore();

    return {
        // getters
        /**
         * Get the total number of items currently in the queue.
         * @returns {number}
         */
        length() {
            return store.length();
        },

        /**
         * Peek at the ID at the front of the queue without removing it.
         * @param {number} index - The position in the queue (0 = first track).
         * @returns {string|null} The track ID, or null if empty.
         */
        peekId(index = 0) {
            const ids = store.getIds();
            return ids[index] || null;
        },

         /**
         * Peek at the full track object at the front of the queue.
         * @param {number} index - The position in the queue (0 = first track).
         * @returns {object|null} The track object, or null if empty.
         */
        peekTrack(index = 0) {
            const id = this.peekId();
            return id ? TrackStore.get(id) : null;
        },

        /**
         * Get a copy of the queue's ID list.
         * @returns {string[]} Array of IDs.
         */
        getIds() {
            return store.getIds();
        },

        /**
         * Get the full track objects for each ID in the queue.
         * @returns {object[]} Array of track objects.
         */
        getTracks() {
            return store.getTracks(TrackStore);
        },

        // setters / sync
        /**
         * Replace the entire queue with a new list of IDs.
         * @param {string[]} ids - New queue order.
         */
        setAll(ids) {
            store.setAll(ids);
        },

        /**
         * Clear the entire queue, except the first if there is one.
         * @returns {string|None} id - Currently playing id
         */
        clear() {
            const id = store.pop();
            store.clear();
            if (id) {
                store.insert(id);
            }
            return id;
        },

        // operations
        /**
         * Push an ID to the end of the queue (tail).
         * @param {string} id - Track ID to enqueue.
         */
        push(id) {
            store.push(id);
        },

        /**
         * Insert an ID near the front of the queue (index 1), keeping the current front intact.
         * Useful for “Play Next” functionality.
         * @param {string} id - Track ID to insert.
         */
        pushFront(id) {
            store.insert(id, 1);
        },

        /**
         * Pop and return the ID at the front of the queue (head).
         * @returns {string|null} Removed ID or null if queue is empty.
         */
        pop() {
            return store.pop();
        },

        /**
         * Conditionally remove an item at a specific index, only if the ID matches.
         * @param {string} id - Expected ID at that index.
         * @param {number} index - Index to remove.
         * @returns {string|null} Removed ID or null if failure.
         */
        removeAt(id, index) {
            const ids = store.getIds();
            if (index >= 0 && index < ids.length && ids[index] === id) {
                return store.removeAt(index);
            }
            return null;
        },

        /**
         * Reorder only works on elements not currently playing
         * @param {number} fromIndex 
         * @param {number} toIndex 
         * @returns {boolean}
         */
        reorder(fromIndex, toIndex) {
            if (fromIndex < 1 || toIndex < 1) {
                return false;
            }
            return store.reorder(fromIndex, toIndex);
        },


        /**
         * Replace the first item in the queue with a new ID.
         * This effectively “skips” the current item and replaces it.
         * @param {string} id - ID to insert at the front.
         */
        setFirst(id) {
            store.pop();
            store.insert(id, 0);
        },
    };
})();
