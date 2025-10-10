//static/js/dom/builder.js

import { prepareDataset, formatTime } from "../../utils/index.js";

//helper to create element with optional attributes and children
export function createElem(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
        if (key === "dataset") {
        Object.entries(val).forEach(([dKey, dVal]) => {
            el.dataset[dKey] = dVal;
        });
        } else if (key === "textContent") {
            el.textContent = val;
        } else {
            el.setAttribute(key, val);
        }
    }
    children.forEach(child => el.appendChild(child));
    return el;
}





