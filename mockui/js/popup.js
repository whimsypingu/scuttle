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
    showPopup(`
        <h3 class="popup-message">Create Playlist</h3>
        <input class="menu-input" type="text" placeholder="New name">

        <div class="popup-save-cancel">
            <button class="menu-button green">Save</button>
            <button class="menu-button">Cancel</button>
        </div>
    `);
});

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
        hidePopup();
    }
})
