export function populateMockLibraryItems() {
    const ul = document.getElementById("library-list");

    for (let i = 0; i < 20; i++) {
        const li = document.createElement("li");
        li.className = "library-item";
        li.innerHTML = `
            <div class="library-title-and-author">
                <p class="library-item-title">extremely long title way too long #${i + 1}</p>
                <p class="library-item-author">author ${i + 1}</p>
            </div>
            <div class="library-duration">
                <p class="library-item-duration">${Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}</p>
            </div>
            <div class="library-actions">
                <button class="library-item-play normal-button">
                    <i class="fa fa-play"></i>
                </button>
                <button class="library-item-save normal-button">
                    <i class="fa fa-plus-square"></i>
                </button>
            </div>
        `;
        ul.appendChild(li);
    }
}

export function populateMockQueueItems() {
    const ul = document.getElementById("queue-list");

    for (let i = 0; i < 20; i++) {
        const li = document.createElement("li");
        li.className = "queue-item";
        li.innerHTML = `
            <div class="queue-title-and-author">
                <p class="queue-item-title">extremely long title way too long #${i + 1}</p>
                <p class="queue-item-author">author ${i + 1}</p>
            </div>
            <div class="queue-duration">
                <p class="queue-item-duration">${Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}</p>
            </div>
            <div class="queue-actions">
                <button class="queue-item-play normal-button">
                    <i class="fa fa-play"></i>
                </button>
                <button class="queue-item-save normal-button">
                    <i class="fa fa-plus-square"></i>
                </button>
            </div>
        `;
        ul.appendChild(li);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    populateMockLibraryItems();
    populateMockQueueItems();
});