//static/js/utils/parsers.js

//helper for parsing
export function parseTrackFromDataset(dataset) {
    const id = dataset.id;
    const title = dataset.title;
    const uploader = dataset.uploader;
    const duration = parseInt(dataset.duration);

    if (!id || !title || !uploader || isNaN(duration)) {
        console.error("Null track data");
        return null;
    }
    
    return { id, title, uploader, duration };
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




//capitalize header labels nicely
export function formatHeader(header) {
    return header
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}



//formats seconds -> MM:SS
export function formatTime(seconds) {
    const totalSecs = Math.round(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}