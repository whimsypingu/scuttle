export { search, deepSearch, downloadSearch } from "./lib/api.js";


//inject here

import { searchDomEls } from "../../dom/selectors.js";
const { searchInputEl, searchDropdownEl } = searchDomEls;

import * as searchUI from "./lib/ui.js";

export const showDropdown = () => searchUI.showDropdown(searchDropdownEl);
export const hideDropdown = () => searchUI.hideDropdown(searchDropdownEl);

export const focusSearchInput = () => searchUI.focusSearchInput(searchInputEl);
export const unfocusSearchInput = () => searchUI.unfocusSearchInput(searchInputEl);
export const getTrimmedSearchInput = () => searchUI.getTrimmedSearchInput(searchInputEl);

export {
    setClearInput
} from "./lib/ui.js";