// ID-based store for likes, playlist tracks, or queue
export function createIdStore() {
    let idList = [];

    return {
        //getters
        length() {
            return idList.length;
        },
        getIds() {
            return [...idList];
        },
        getTrackById(trackStore, id) {
            return trackStore.get(id) || null;
        },
        getTracks(trackStore) {
            return idList.map(id => trackStore.get(id)).filter(Boolean);
        },

        //helpers
        has(id) {
            return idList.includes(id);
        },

        //modifiers
        insert(id, index) {
            if (index < 0) index = 0;
            if (index > idList.length) index = idList.length;

            idList.splice(index, 0, id);
        },
        add(id) {
            if (!idList.includes(id)) {
                idList.push(id);
            }
        },
        push(id) {
            idList.push(id);
        },
        pop() {
            return idList.shift() || null;
        },
        remove(id) {
            idList = idList.filter(x => x !== id);
        },
        removeAt(index) {
            if (index < 0 || index >= idList.length) {
                return null;
            }
            const [removed] = idList.splice(index, 1);
            return removed || null;
        },
        reorder(fromIndex, toIndex) {
            if (fromIndex < 0 || fromIndex >= idList.length || toIndex < 0 || toIndex >= idList.length) {
                return null;
            }
            const [moved] = idList.splice(fromIndex, 1);
            idList.splice(toIndex, 0, moved);
            return true;
        },
        
        //setters
        clear() {
            idList = [];
        },
        setAll(ids) {
            idList = [...ids];
        },
    };
}
