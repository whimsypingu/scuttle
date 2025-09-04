export function getSelectedPlaylists(optionEls) {
    return Array.from(optionEls).map(el => ({
        id: el.dataset.id,
        checked: el.classList.contains("checked")
    }));
}