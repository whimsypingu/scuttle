import { domEls, playlistDomEls } from "../../dom/selectors.js";
import { getQueueContent, renderQueue } from "../../features/queue/index.js";

import { getLibraryContent, getLikedContent, renderNewCustomPlaylist, renderPlaylist } from "../../features/playlist/index.js";
import { getPlaylistContent, getPlaylists } from "../../features/playlist/lib/api.js"; //move to index.js

import { LikeStore } from "../../cache/LikeStore.js";
import { QueueStore } from "../../cache/QueueStore.js";
import { PlaylistStore } from "../../cache/PlaylistStore.js";
import { TrackStore } from "../../cache/TrackStore.js";
import { setLoopButton } from "../../features/audio/index.js";
import { onLoad } from "../../features/audio/controller.js";


//loads source of truth for library, TrackStore, which other references rely on
async function bootstrapLibrary() {
    try {
        const data = await getLibraryContent(); //fix, maybe rename to getAllTracks or something
        console.log("Bootstrap library content:", data.content);

        TrackStore.setAll(data.content);

        renderPlaylist(domEls.libraryListEl, TrackStore.getTracks());
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

async function bootstrapQueue() {
    try {
        const data = await getQueueContent();
        console.log("Bootstrap queue content:", data.content); //NEED TO CHANGE THIS TO JUST IDS

        QueueStore.setAll(data.content); //accepts ids

        renderQueue();
        setLoopButton(true, false)

        //onLoad();
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

async function bootstrapLikes() {
    try {
        const data = await getLikedContent();
        console.log("Bootstrap like content:", data.content);

        const likes = data.content;
        
        LikeStore.setAll(likes); //accepts ids
        const tracks = LikeStore.getTracks();

        renderPlaylist(domEls.likedListEl, tracks);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}


async function bootstrapPlaylists() {
    try {
        const data = await getPlaylists(); // {content: [{id, name}...]}
        console.log("Bootstrap playlist content:", data.content);

        const playlists = data.content; // [{id, name}, etc]

        for (const pl of playlists) {
            const plData = await getPlaylistContent(pl.id); // {content: {id, name, trackIds[]}}

            const trackIds = plData.content.trackIds; // [id1, id2, ...]
            
            //add to local playlists;
            PlaylistStore.create(pl.id, pl.name, trackIds);

            console.log("Playlist", pl.id, "Name", pl.name, "Content:", PlaylistStore.getTrackIds(pl.id));

            //create visual elements
            const newCustomListEl = renderNewCustomPlaylist(playlistDomEls.customPlaylistEl, pl.name, pl.id);
            renderPlaylist(newCustomListEl, PlaylistStore.getTracks(pl.id));
        }
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}


export async function bootstrapAll() {
    await bootstrapLibrary();
    await Promise.all([
        bootstrapQueue(),
        bootstrapLikes(),
        bootstrapPlaylists()
    ]);
}
