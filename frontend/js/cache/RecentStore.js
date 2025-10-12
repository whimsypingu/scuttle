// Node in a doubly linked list
class RecentNode {
    constructor(id, entry) {
        this.id = id;
        this.entry = entry;
        this.prev = null;
        this.next = null;
    }
}

export const RecentStore = (() => {
    const recentById = {}; // O(1) lookup
    let head = null;       // most recent
    let tail = null;       // oldest
    let maxSize = Infinity;
    let currentSize = 0;

    function insertAtFront(node) {
        if (!head) {
            head = tail = node;
        } else {
            node.next = head;
            head.prev = node;
            head = node;
        }
        currentSize++;
    }

    function removeNode(node) {
        if (!node) return;
        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;
        if (node === head) head = node.next;
        if (node === tail) tail = node.prev;
        node.prev = node.next = null;
        currentSize--;
    }

    function removeTail() {
        if (!tail) return;
        const id = tail.id;
        removeNode(tail);
        delete recentById[id];
    }

    return {
        /**
         * Configure max size
         * @param {number} size
         */
        setMaxSize(size) {
            maxSize = size;
            // remove oldest if current size exceeds new max
            while (currentSize > maxSize) {
                removeTail();
            }
        },

        /**
         * Add or move an entry to the front (most recent).
         * @param {string} id
         * @param {{type: string, content: object}} entry
         */
        push(id, entry) {
            if (recentById[id]) {
                removeNode(recentById[id]);
            }
            const node = new RecentNode(id, entry);
            insertAtFront(node);
            recentById[id] = node;

            // enforce max size
            while (currentSize > maxSize) {
                removeTail();
            }
        },

        /**
         * Get entry by ID
         * @param {string} id
         * @returns {object|null}
         */
        get(id) {
            return recentById[id]?.entry || null;
        },

        /**
         * Get all entries in order (most recent first)
         * @returns {Array<{type: string, content: object}>}
         */
        getAll() {
            const result = [];
            let curr = head;
            while (curr) {
                result.push(curr.entry);
                curr = curr.next;
            }
            return result;
        },

        /**
         * Remove an entry by ID
         * @param {string} id
         * @returns {boolean} true if removed
         */
        remove(id) {
            const node = recentById[id];
            if (!node) return false;
            removeNode(node);
            delete recentById[id];
            return true;
        },

        /**
         * Clear all entries
         */
        clear() {
            head = tail = null;
            currentSize = 0;
            for (const id in recentById) delete recentById[id];
        },

        /**
         * Set all entries at once (preserve order in array)
         * @param {Array<{id: string, type: string, content: object}>} entries
         */
        setAll(entries) {
            this.clear();
            for (let i = entries.length - 1; i >= 0; i--) {
                const { id, type, content } = entries[i];
                this.push(id, { type, content });
            }
        },
    };
})();
