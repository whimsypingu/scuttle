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



export function buildAreYouSurePopup(options = {}) {
    const {
        message = "Are you sure?",
        saveText = "Confirm",
        saveColor = "red",
    } = options;

    const popup = document.createElement("div");
    popup.classList.add("popup-content");

    popup.innerHTML = `
        <div class="scrollable-popup-content">
            <h3 class="popup-message">${message}</h3>
        </div>
        
        <div class="popup-actions">
            <button class="menu-button ${saveColor} js-save">${saveText}</button>
            <button class="menu-button js-cancel">Cancel</button>
        </div>
    `;
    return popup;
}