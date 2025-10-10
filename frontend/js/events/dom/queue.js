import { queueDomEls } from "../../dom/index.js";

import { 
    onClickClearQueue,
    onClickQueueList,
    onClickShuffleQueue,
} from "../../features/queue/controller.js";


export function setupQueueEventListeners() {
    queueDomEls.queueShuffleButtonEl.addEventListener("click", () => onClickShuffleQueue());
    queueDomEls.queueClearButtonEl.addEventListener("click", () => onClickClearQueue());
    queueDomEls.queueListEl.addEventListener("click", (e) => onClickQueueList(e));
}