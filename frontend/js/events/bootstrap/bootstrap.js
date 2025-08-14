import { SELECTORS, $ } from "../../dom/selectors.js";
import { getQueueContent } from "../../features/queue/index.js";
import { renderQueueUI } from "../../features/queue/controller.js";

import { getLibraryContent, renderLibraryList } from "../../features/library/index.js";


export async function bootstrapQueue() {
    try {
        const data = await getQueueContent();
        console.log(data.content);

        const domEls = {
            queueListEl: $(SELECTORS.queue.ids.LIST),
            titleEl: $(SELECTORS.audio.ids.TITLE),
            authorEl: $(SELECTORS.audio.ids.AUTHOR),
        }

        renderQueueUI(domEls, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

export async function bootstrapLibrary() {
    try {
        const data = await getLibraryContent();
        console.log(data.content);

        const libraryListEl = $(SELECTORS.library.ids.LIST);
        renderLibraryList(libraryListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}