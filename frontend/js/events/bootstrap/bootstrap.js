import { domEls } from "../../dom/selectors.js";
import { getQueueContent, redrawQueueUI } from "../../features/queue/index.js";

import { getLibraryContent, getLikedContent, renderPlaylist } from "../../features/playlist/index.js";
import { setLocalQueue } from "../../cache/localqueue.js";
import { setLocalLikes } from "../../cache/liked.js";


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

export async function bootstrapAll() {
    bootstrapQueue();
    bootstrapLibrary();
    bootstrapLikes();
}
