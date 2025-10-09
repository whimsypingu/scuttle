import { createIdStore } from './utils/IdStore.js';
import { TrackStore } from './TrackStore.js';

export const QueueStore = (() => {
    const store = createIdStore();

    return {
        // getters
        length() {
            return store.length;
        },
        peekId() {
            const ids = store.getIds();
            return ids[0] || null;
        },
        peekTrack() {
            const id = this.peekId();
            return id? TrackStore.get(id) : null;
        },

        getIds() {
            return store.getIds();
        },
        getTracks() {
            return store.getTracks(TrackStore);
        },

        // setters / sync
        setAll(ids) {
            store.setAll(ids);
        },
        clear() {
            store.clear();
        },

        // operations
        push(id) {
            store.push(id);
        },
        pushFront(id) {
            store.insert(id, 1);
        },
        pop() {
            return store.pop();
        },
        removeAt(index) {
            const ids = store.getIds();
            if (index >= 0 && index < ids.length) {
                store.remove(ids[index]);
            }
        },
        setFirst(id) {
            store.pop();
            store.insert(id, 0);
        },
    };
})();
