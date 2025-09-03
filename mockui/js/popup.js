const overlay = document.getElementById("popup-overlay");
const content = document.getElementById("popup-content");

export function showPopup(innerHTML) {
    content.innerHTML = innerHTML;
    overlay.classList.add("active");
}

export function hidePopup() {
    overlay.classList.remove("active");
}

// Example usage
document.querySelector("#search").addEventListener("click", () => {
    // showPopup(`
    //     <h3 class="popup-message">Create Playlist</h3>
    //     <input class="menu-input" type="text" placeholder="New name">

    //     <div class="popup-save-cancel">
    //         <button class="menu-button green">Save</button>
    //         <button class="menu-button">Cancel</button>
    //     </div>
    // `);
    const playlists = [
        {"id": 1, "name": "test1", "checked": true},
        {"id": 2, "name": "test2", "checked": false},
        {"id": 3, "name": "test3", "checked": true}        
    ]
    showPopup(`
        <h3 class="popup-message">Edit Track</h3>

        <div class="rename-playlist">
            <input>
        </div>

        <div class="playlist-selection-menu">
            ${playlists.map(pl => `
                <label class="playlist-option ${pl.checked ? 'checked' : ''}">
                    <span class="checkbox"></span>
                    <p class="playlist-name">${pl.name}</p>
                </label>
            `).join("")}
        </div>

        <div class="popup-save-cancel">
            <button class="menu-button green">Save</button>
            <button class="menu-button">Cancel</button>
        </div>
    `)

    document.querySelector(".playlist-selection-menu").addEventListener("click", (e) => {
        const option = e.target.closest(".playlist-option");
        if (!option) return;

        option.classList.toggle("checked");
    });
});

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
        hidePopup();
    }
})
