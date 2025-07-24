import { SELECTORS, $ } from "../../dom/index.js";

import { 
    onClickQueueList 
} from "../../features/queue/controller.js";



const domEls = {
    queueList: $(SELECTORS.queue.ids.LIST)
};

export function setupQueueEventListeners() {
    domEls.queueList.addEventListener("click", (e) => onClickQueueList(e, domEls));
}