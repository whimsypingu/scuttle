//static/js/features/library/lib/api.js
//corresponds to /backend/routers/search-router.py

import { getResponse } from "../../../utils/index.js";


export async function getLibraryContent() {
    const response = await getResponse(`/search/?q=`);
    
    const data = await response.json();
    return data;
}
