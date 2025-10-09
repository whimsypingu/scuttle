import { queueDomEls } from "../../dom/index.js";

import { 
    onClickClearQueue,
    onClickQueueList,
} from "../../features/queue/controller.js";


export function setupQueueEventListeners() {
    queueDomEls.queueClearButtonEl.addEventListener("click", () => onClickClearQueue());
    queueDomEls.queueListEl.addEventListener("click", (e) => onClickQueueList(e));
}