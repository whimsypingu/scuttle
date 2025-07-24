import { SELECTORS, $ } from "../../dom/selectors.js";
import { getQueueContents, renderQueueList } from "../../features/queue/index.js";


export async function bootstrapAll() {
    bootstrapQueue();
}

async function bootstrapQueue() {
    try {
        const data = await getQueueContents();
        console.log(data.content);

        const queueListEl = $(SELECTORS.queue.ids.LIST);
        renderQueueList(queueListEl, data.content);
    } catch (err) {
        console.error("Bootstrap failed", err);
    }
}