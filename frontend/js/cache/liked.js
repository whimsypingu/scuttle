//store liked songs here

let likedSet = new Set();
let likedList = [];

export function toggleLikeTrack(track) {

    const id = track.youtube_id;

    console.log("ID:", id);
    console.log("has:", likedSet.has(id));
    console.log("list:", likedList);

    if (likedSet.has(id)) {
        //unlike
        likedSet.delete(id);
        const index = likedList.findIndex(t => t.youtube_id === id);
        if (index !== -1) likedList.splice(index, 1);
    } else {
        //like
        likedSet.add(id);
        likedList.push(track);
    }
}


//getters
export function getLikedTracks() {
    return likedList;
}
