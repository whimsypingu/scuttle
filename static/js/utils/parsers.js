//static/js/utils/parsers.js

//helper for parsing
export function parseTrackFromDataset(dataset) {
    const youtubeId = dataset.youtubeId;
    const title = dataset.title;
    const uploader = dataset.uploader;
    const duration = parseInt(dataset.duration);

    if (!youtubeId || !title || !uploader || isNaN(duration)) {
        console.error("Null track data");
        return null;
    }
    
    return { youtube_id: youtubeId, title, uploader, duration };
}



//capitalize header labels nicely
export function formatHeader(header) {
    return header
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}


//builds a dataset from track data
export function prepareDataset(track) {
    const dataset = {};
    for (const [key, val] of Object.entries(track)) {
        
        //converts snake_case to camelCase
        const newKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        dataset[newKey] = val;
    }
    return dataset
}
