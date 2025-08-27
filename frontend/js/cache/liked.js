//store liked songs here

let likedSet = new Set();
let likedList = [];

export function toggleLocalLikes(track) {

    const id = track.id;

    console.log("ID:", id);
    console.log("has:", likedSet.has(id));
    console.log("list:", likedList);

    if (likedSet.has(id)) {
        //unlike
        likedSet.delete(id);
        const index = likedList.findIndex(t => t.id === id);
        if (index !== -1) likedList.splice(index, 1);
    } else {
        //like
        likedSet.add(id);
        likedList.push(track);
    }
}



//getters
export function getLocalLikes() {
    return likedList;
}



//for now just sets the whole thing
export function setLocalLikes(tracks) {
    likedSet.clear();
    likedList = [];

    for (const track of tracks) {
        likedSet.add(track.id);
        likedList.push(track);
    }
}
