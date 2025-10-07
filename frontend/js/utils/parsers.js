//static/js/utils/parsers.js

//helper for parsing
export function parseTrackFromDataset(dataset) {
    const id = dataset.id;
    const title = dataset.title;
    const artist = dataset.artist;
    const duration = parseInt(dataset.duration);

    if (!id || !title || !artist || isNaN(duration)) {
        console.error("Null track data");
        return null;
    }
    
    return { id, title, artist, duration };
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



/**
 * Formats seconds as MM:SS
 * @param {number} seconds - Time in seconds
 * @param {boolean} floor - true to floor, false to ceil
 */
export function formatTime(seconds, floor=true) {
    const totalSecs = floor ? Math.floor(seconds) : Math.ceil(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`; //handles 0:00-0:09
}