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




export function buildCreatePlaylistPopup() {
    const popup = document.createElement("div");
    popup.classList.add("popup-content");
    
    popup.innerHTML = `
        <div class="scrollable-popup-content">

            <h3 class="popup-message">Create Playlist</h3>

            <div class="multi-input-menu">
                <input class="menu-input js-create-playlist-input" type="text" placeholder="New name">
        
                <input class="menu-input js-import-playlist-input" type="text" placeholder="(Optional) Link">
            </div>

        </div>
        
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

    const playlistsHTML = playlists.length > 0
        ? playlists.map(pl => `
            <label class="playlist-option ${pl.checked ? 'checked' : ''}" data-id="${pl.id}">
                <span class="checkbox"></span>
                <p class="playlist-name">${pl.name}</p>
            </label>
        `).join("")
        : 
        `<div class="no-playlists-message">
            <p>No playlists available</p>
        </div>`;

    popup.innerHTML = `
        <div class="scrollable-popup-content">

            <h3 class="popup-message">Playlists</h3>

            <div class="playlist-selection-menu">
                ${playlistsHTML}
            </div>

            <div class="spacing-block">
            </div>

            <h3 class="popup-message">Track Information</h3>

            <div class="multi-input-menu">
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