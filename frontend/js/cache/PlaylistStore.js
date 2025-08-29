import { createIdStore } from './utils/IdStore.js';
import { TrackStore } from './TrackStore.js';


export const PlaylistStore = (() => {
    let playlists = {}; // id: {id, name, IdStore}, etc

    return {
        //getters
        getAll() {
            return playlists;
        },
        getPlaylistById(id) {
            return playlists[id] || null;
        },

        //modifiers
        create(id, name, trackIds = null) {
            const tracks = createIdStore();
            if (trackIds) tracks.setAll(trackIds); //sets to list if given
            
            const pl = {
                id,
                name,
                tracks
            };
            playlists[id] = pl;
            return pl;
        },
        updateId(tempId, newId) {
            if (!playlists[tempId]) return false; //not found

            playlists[newId] = playlists[tempId];
            playlists[newId].id = newId; //update ids

            delete playlists[tempId];

            return true;
        },
        removePlaylist(id) {
            delete playlists[id];
        },
        
        //helpers
        addTrackId(playlistId, trackId) {
            const pl = playlists[playlistId];
            if (pl) pl.tracks.insert(trackId);
        },
        removeTrack(playlistId, trackId) {
            const pl = playlists[playlistId];
            if (pl) pl.tracks.remove(trackId);
        },
        getTrackIds(playlistId) {
            const pl = playlists[playlistId];
            return pl ? pl.tracks.getIds() : [];
        }, 
        getTracks(playlistId) {
            const pl = playlists[playlistId];
            return pl ? pl.tracks.getTracks(TrackStore) : [];
        }
    };
})();
