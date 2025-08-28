import { domEls, playlistDomEls } from "../../dom/selectors.js";
import { getQueueContent, redrawQueueUI } from "../../features/queue/index.js";

import { getLibraryContent, getLikedContent, renderNewCustomPlaylist, renderPlaylist } from "../../features/playlist/index.js";
import { setLocalQueue, setLocalLikes, setLocalPlaylists } from "../../cache/index.js";
import { getPlaylistContent, getPlaylists } from "../../features/playlist/lib/api.js"; //move to index.js


async function bootstrapQueue() {
    try {
        const data = await getQueueContent();
        console.log(data.content);

        setLocalQueue(data.content);

        redrawQueueUI(domEls.queueListEl, domEls.titleEl, domEls.authorEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

async function bootstrapLibrary() {
    try {
        const data = await getLibraryContent(); //fix
        console.log(data.content);

        renderPlaylist(domEls.libraryListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

async function bootstrapLikes() {
    try {
        const data = await getLikedContent();
        console.log(data.content);

        setLocalLikes(data.content);

        renderPlaylist(domEls.likedListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}


async function bootstrapPlaylists() {
    try {
        const data = await getPlaylists(); //implement
        console.log(data.content);

        const playlists = data.content;

        for (const pl of playlists) {
            const plData = await getPlaylistContent(pl.id);

            //add to local playlists

            const newCustomListEl = renderNewCustomPlaylist(playlistDomEls.customPlaylistEl, pl.name, pl.id);
            renderPlaylist(newCustomListEl, plData.tracks);
        }
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}


export async function bootstrapAll() {
    bootstrapQueue();
    bootstrapLibrary();
    bootstrapLikes();
    bootstrapPlaylists();
}
