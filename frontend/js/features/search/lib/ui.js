import { collapsedHeight } from "../../../dom/index.js";


export function showDropdown(searchDropdownEl) {
    searchDropdownEl.classList.remove("hidden");
    // const dropdownHeight = document.getElementById("playlists").getBoundingClientRect().height;

    // searchDropdownEl.style.height = dropdownHeight + "px";
}

export function hideDropdown(searchDropdownEl) {
    searchDropdownEl.classList.add("hidden");
    //searchDropdownEl.style.height = "0px";
}