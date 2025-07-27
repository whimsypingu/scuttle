//static/js/features/search/controller.js

import { search, deepSearch } from "./index.js";

//typing in the search bar
export async function onSearchInput(e) {
    const q = e.target.value.trim();
    console.log("Search query:", q);

    await search(q);
}


//commit search
export async function onSearchEnter(e) {
	if (e.key !== "Enter") return;
	e.preventDefault(); //prevent form submit just in case

    const q = e.target.value.trim();
    console.log("Searched:", q);

	if (!q) return;

    await deepSearch(q);
}