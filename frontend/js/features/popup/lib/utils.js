/**
 * Extracts selected playlist information from a list of option elements.
 *
 * @param {NodeList|HTMLElement[]} optionEls - A collection of elements representing playlist options.
 * Each element should have a `data-id` attribute and may have the `checked` class to indicate selection.
 *
 * @returns {Array<{id: string, checked: boolean}>} An array of objects where each object contains:
 *   - `id`: The playlist ID (string) from `data-id`.
 *   - `checked`: Whether the playlist is currently marked as checked.
 */
export function getSelectedPlaylists(optionEls) {
    return Array.from(optionEls).map(el => ({
        id: el.dataset.id,
        checked: el.classList.contains("checked")
    }));
}

/**
 * Gets and trims the value of an input element.
 *
 * @param {HTMLInputElement} inputEl - The input element to read from.
 *
 * @returns {string} The trimmed value of the input field.
 */
export function getInputValue(inputEl) {
    return inputEl.value.trim();
}