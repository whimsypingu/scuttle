export function getSelectedPlaylists(optionEls) {
    return Array.from(optionEls).map(el => ({
        playlistId: el.dataset.id,
        checked: el.classList.contains("checked")
    }));
}