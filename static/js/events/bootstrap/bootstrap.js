import { SELECTORS, $ } from "../../dom/selectors.js";
import { getQueueContent, renderQueueList } from "../../features/queue/index.js";
import { getLibraryContent, renderLibraryList } from "../../features/library/index.js";


export async function bootstrapAll() {
    bootstrapQueue();
    bootstrapLibrary();
}

async function bootstrapQueue() {
    try {
        const data = await getQueueContent();
        console.log(data.content);

        const queueListEl = $(SELECTORS.queue.ids.LIST);
        renderQueueList(queueListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}

async function bootstrapLibrary() {
    try {
        const data = await getLibraryContent();
        console.log(data.content);

        const libraryListEl = $(SELECTORS.library.ids.LIST);
        renderLibraryList(libraryListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}