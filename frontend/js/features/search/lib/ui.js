export function showDropdown(searchDropdownEl) {
    searchDropdownEl.classList.remove("hidden"); //css handles height animation
}

export function hideDropdown(searchDropdownEl) {
    searchDropdownEl.classList.add("hidden");
}


let clearInput = false; //handles clearing input

export function setClearInput(status) {
    clearInput = status;
}

export function focusSearchInput(searchInputEl) {
    if (clearInput) {
        searchInputEl.value = "";
    }
    searchInputEl.focus(); //required now to trigger the focus
}

export function unfocusSearchInput(searchInputEl) {
    searchInputEl.blur();
}

export function getTrimmedSearchInput(searchInputEl) {
    return searchInputEl.value.trim();
}
