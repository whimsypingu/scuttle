//static/js/dom/builder.js

import { SELECTORS } from "./selectors.js";

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

export function buildTrackListItem(track) {
    const li = document.createElement("li");
    li.className = "list-track-item";
        
    // Add the track data to the li itself
    const trackDataset = prepareDataset(track);
    Object.entries(trackDataset).forEach(([key, value]) => {
        li.dataset[key] = value;
    });

    const index = 99;
    li.innerHTML = `
        <div class="swipe-action left">
            <i class="fa fa-plus-square"></i>
        </div>

        <div class="foreground">
            <div class="position">
                <p class="position-value">${index}</p>
            </div>
            <div class="info">
                <p class="title">${track.title || "Untitled"}</p>
                <p class="author">${track.uploader || "Unknown artist"}</p>
            </div>
            <div class="duration">
                <p class="duration-value">${formatTime(track.duration)}</p>
            </div>
        </div>

        <div class="actions">
            <button class="queue-button normal-button">
                <i class="fa fa-plus-square"></i>
            </button>
            <button class="more-button normal-button">
                <i class="fa fa-cog"></i>
            </button>
        </div>

        <div class="swipe-action right">
            <i class="fa fa-heart"></i>
        </div>
    `;
    return li;
}

export function buildTrackListEmptyItem() {
    const li = document.createElement("li");
    li.className = "list-track-empty-item";
        
    li.innerHTML = `
        <p>No tracks available</p>
    `;
    return li;
}



export function buildCreatePlaylistPopup() {
    const popup = document.createElement("div");
    popup.className = "popup-content";
    
    popup.innerHTML = `
        <h3 class="popup-message">Create Playlist</h3>

        <input class="menu-input" type="text" placeholder="New name">

        <div class="popup-actions">
            <button class="menu-button green create-playlist">Save</button>
            <button class="menu-button cancel">Cancel</button>
        </div>
    `;
    return popup
}