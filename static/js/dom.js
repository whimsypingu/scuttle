//static/js/dom.js

//shorthand for document.querySelector and querySelectorAll
export function $(id) {
	return document.getElementById(id);
}

//DOM ID constants
export const DOM_IDS = {
	SEARCH_INPUT: "searchInput",
	SEARCH_AND_DOWNLOAD_BUTTON: "searchAndDownloadButton"
};
