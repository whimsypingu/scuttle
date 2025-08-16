// frontend/js/cache/indexeddb.js

const Cache = (() => {
    const DB_NAME = 'appCache';
    const DB_VERSION = 1;
    const STORE_NAME = 'keyValueStore';
    const MAX_ITEMS = 20; //eviction
    let db;

    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' }); // id is now the primary key
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function getStore(mode = 'readonly') {
        const database = await openDB();
        const tx = database.transaction(STORE_NAME, mode);
        return tx.objectStore(STORE_NAME);
    }

    //return all keys in the cache
    async function keys() {
        const store = await getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAllKeys();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    //eviction
    async function evictOldestIfNeeded() {
        const allKeys = await keys();
        if (allKeys.length < MAX_ITEMS) return;

        // Fetch all entries to find the oldest
        const store = await getStore('readonly');
        const items = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });

        if (items.length > 0) {
            items.sort((a, b) => a.lastAccess - b.lastAccess);
            await remove(items[0].id);
        }
    }

    //set using eviction strategy
    async function set(id, dataset, blob) {
        await evictOldestIfNeeded();
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({
                id,
                lastAccess: Date.now(),
                dataset,
                blob
            });
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    //retrieve and update metadata
    async function get(id) {
        const store = await getStore('readwrite'); // readwrite to update lastAccess
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result || null;
                if (result) {
                    result.lastAccess = Date.now();
                    store.put(result); // update access time
                }
                resolve(result);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    //confirm existence without updating metadata
    async function contains(id) {
        const store = await getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.getKey(id); // getKey is slightly faster than get()
            request.onsuccess = () => resolve(!!request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }


    async function remove(id) {
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function clear() {
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    return { keys, set, get, contains, remove, clear };
})();


// Usage example:
// await Cache.set('myKey', dataset, blob);
// const value = await Cache.get('myKey');
// await Cache.remove('myKey');
// await Cache.clear();

export default Cache;
