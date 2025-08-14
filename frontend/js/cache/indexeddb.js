// frontend/js/cache/idnexeddb.js

//ty chat
const Cache = (() => {
    const DB_NAME = 'appCache';
    const DB_VERSION = 1;
    const STORE_NAME = 'keyValueStore';

    let db;

    // Open (or create) the database
    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db); // Already open

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Helper: get transaction and object store
    async function getStore(mode = 'readonly') {
        const database = await openDB();
        const tx = database.transaction(STORE_NAME, mode);
        return tx.objectStore(STORE_NAME);
    }

    // Set a value
    async function set(key, value) {
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Get a value
    async function get(key) {
        const store = await getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Delete a key
    async function remove(key) {
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Clear all keys
    async function clear() {
        const store = await getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    return { set, get, remove, clear };
})();

// Usage example:
// await Cache.set('myKey', { some: 'data' });
// const value = await Cache.get('myKey');
// await Cache.remove('myKey');
// await Cache.clear();

export default Cache;
