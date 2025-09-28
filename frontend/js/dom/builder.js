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

export function buildTrackListItem(track) {
    const li = document.createElement("li");
    li.classList.add("list-track-item");

    //store the trackId
    li.dataset.trackId = track.id;
        
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
                <p class="artist">${track.artist || "Unknown artist"}</p>
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
    li.classList.add("list-track-empty-item");
        
    li.innerHTML = `
        <p>No tracks available</p>
    `;
    return li;
}



export function buildCreatePlaylistPopup() {
    const popup = document.createElement("div");
    popup.classList.add("popup-content");
    
    popup.innerHTML = `
        <h3 class="popup-message">Create Playlist</h3>

        <input class="menu-input js-create-playlist-input" type="text" placeholder="New name">

        <div class="popup-actions">
            <button class="menu-button green js-save">Save</button>
            <button class="menu-button js-cancel">Cancel</button>
        </div>
    `;
    return popup;
}


//FINISH ME
export function buildEditTrackPopup(playlists, track) {
    const popup = document.createElement("div");
    popup.classList.add("popup-content");

    // expects something like this
    // const playlists = [
    //     {"id": 1, "name": "test1", "checked": true},
    //     {"id": 2, "name": "test2", "checked": false},
    //     {"id": 3, "name": "test3", "checked": true}        
    // ]
    console.log("TRACK DATA", track);
    popup.innerHTML = `
        <div class="scrollable-popup-content">

            <h3 class="popup-message">Playlists</h3>

            <div class="playlist-selection-menu">
                ${playlists.map(pl => `
                    <label class="playlist-option ${pl.checked ? 'checked' : ''}" data-id="${pl.id}">
                        <span class="checkbox"></span>
                        <p class="playlist-name">${pl.name}</p>
                    </label>
                `).join("")}
            </div>

            <div class="spacing-block">
            </div>

            <h3 class="popup-message">Track Information</h3>

            <div class="edit-track-metadata-menu">
                <input type="text" class="menu-input js-track-title" value="${track.title}" placeholder="Title..." />
            
                <input type="text" class="menu-input js-track-artist" value="${track.artist}" placeholder="Artist..." />
            </div>

            <div class="spacing-block">
            </div>

            <h3 class="popup-message">Delete</h3>
            <div class="delete-track-menu">
                <button class="menu-button red js-delete">
                    <i class="fa fa-trash"></i>
                </button>
            </div>

        </div>
        
        <div class="popup-actions">
            <button class="menu-button green js-save">Save</button>
            <button class="menu-button js-cancel">Cancel</button>
        </div>
    `;
    return popup;
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