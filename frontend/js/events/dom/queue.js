import { domEls } from "../../dom/index.js";

import { 
    onClickQueueList,
} from "../../features/queue/controller.js";


export function setupQueueEventListeners() {
    domEls.queueListEl.addEventListener("click", (e) => onClickQueueList(e));
}