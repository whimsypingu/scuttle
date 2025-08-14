//static/js/features/search/api.js
//corresponds to /backend/routers/search-router.py

import { getResponse } from "../../../utils/index.js";


export async function search(q) {
    const response = await getResponse(`/search/?q=${encodeURIComponent(q)}`);
    
    const data = await response.json();
    return data;
}


export async function deepSearch(q) {
    const response = await getResponse(`/search/deep?q=${encodeURIComponent(q)}`);
    
    const data = await response.json();
    return data;
}