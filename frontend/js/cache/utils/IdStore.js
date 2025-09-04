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
        insert(id) {
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
        
        //setters
        clear() {
            idList = [];
        },
        setAll(ids) {
            idList = [...ids];
        },
    };
}
