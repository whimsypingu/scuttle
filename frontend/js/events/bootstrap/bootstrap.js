import { domEls } from "../../dom/selectors.js";
import { getQueueContent, redrawQueueUI } from "../../features/queue/index.js";

import { getLibraryContent, renderLibraryList } from "../../features/playlist/index.js";


export async function bootstrapQueue() {
    try {
        const data = await getQueueContent();
        console.log(data.content);

        redrawQueueUI(domEls.queueListEl, domEls.titleEl, domEls.authorEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

export async function bootstrapLibrary() {
    try {
        const data = await getLibraryContent();
        console.log(data.content);

        renderLibraryList(domEls.libraryListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}