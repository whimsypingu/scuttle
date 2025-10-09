//static/js/dom/builder.js

import { prepareDataset, formatTime } from "../utils/index.js";

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






export function buildNewPlaylist(name, id) {
    const playlist = document.createElement("div");
    playlist.classList.add("playlist");

    playlist.dataset.name = name;
    playlist.dataset.id = id;

    playlist.innerHTML = `
        <div class="list-header">
            <h3 class="list-title">${name}</h3>
        </div>

        <div class="playlist-options">
            <button class="playlist-option-button">
                <i class="fa fa-ellipsis-h"></i>
            </button>

            <button class="playlist-option-button shuffle-playlist-button">
                <i class="fa fa-random"></i>
            </button>

            <button class="playlist-option-button play-playlist-button">
                <i class="fa fa-play"></i>
            </button>
        </div>

        <ul class="list-track">
        </ul>
    `;

    return playlist;
}