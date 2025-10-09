/**
 * Builds a popup DOM element for creating a new playlist.
 *
 * The popup contains inputs for the playlist name and an optional import link,
 * along with Save and Cancel buttons.
 *
 * @returns {HTMLDivElement} The constructed "Create Playlist" popup element.
 *
 * @example
 * const popup = buildCreatePlaylistPopup();
 * document.body.appendChild(popup);
 */
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



/**
 * Builds a popup DOM element for editing a track's playlist membership and metadata.
 *
 * The popup contains:
 *  - A playlist selection menu with checkboxes indicating which playlists the track is in.
 *  - Inputs to edit the track's title and artist.
 *  - A button to delete the track.
 *  - Save and Cancel buttons at the bottom.
 *
 * @param {Array<{id: string|number, name: string, checked: boolean}>} playlists - List of playlists, with a `checked` flag indicating if the track is currently in that playlist.
 * @param {{title: string, artist: string, id: string|number}} track - Track data to pre-fill the track information fields.
 *
 * @returns {HTMLDivElement} The constructed "Edit Track" popup element.
 *
 * @example
 * const playlists = [
 *   { id: 1, name: "Favorites", checked: true },
 *   { id: 2, name: "Chill", checked: false },
 * ];
 * const track = { id: 101, title: "Song Name", artist: "Artist Name" };
 * const popup = buildEditTrackPopup(playlists, track);
 * document.body.appendChild(popup);
 */
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



/**
 * Builds a configurable "Are You Sure?" confirmation popup DOM element.
 *
 * This function creates a popup element containing a message and action buttons
 * (confirm/save and cancel). The appearance and text of the confirm/save button
 * can be customized via options.
 *
 * @param {Object} options - Optional configuration for the popup.
 * @param {string} [options.message="Are you sure?"] - The main message to display in the popup.
 * @param {string} [options.saveText="Confirm"] - Text to display on the confirm/save button.
 * @param {string} [options.saveColor="red"] - CSS class or color modifier to apply to the confirm/save button.
 *
 * @returns {HTMLDivElement} - The constructed popup DOM element, ready to append to the page.
 *
 * @example
 * // Create a standard "Are you sure?" popup
 * const popup = buildAreYouSurePopup();
 * document.body.appendChild(popup);
 *
 * @example
 * // Create a custom popup with green confirm button and custom message
 * const popup = buildAreYouSurePopup({
 *   message: "Delete this track?",
 *   saveText: "Yes, delete",
 *   saveColor: "green"
 * });
 * document.body.appendChild(popup);
 */
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