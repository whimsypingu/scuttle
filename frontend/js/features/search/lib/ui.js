export function showDropdown(searchDropdownEl) {
    searchDropdownEl.classList.remove("hidden"); //css handles height animation
}

export function hideDropdown(searchDropdownEl) {
    searchDropdownEl.classList.add("hidden");
}


let clearInput = false;

export function setClearInput(status) {
    clearInput = status;
}

export function focusSearchInput(searchInputEl) {
    if (clearInput) {
        searchInputEl.value = "";
    }
    searchInputEl.focus(); //probably redundant
}

export function unfocusSearchInput(searchInputEl) {
    searchInputEl.blur();
}

export function getTrimmedSearchInput(searchInputEl) {
    return searchInputEl.value.trim();
}
