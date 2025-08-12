export function populateMockLibraryItems() {
    const ul = document.getElementById("library-list");

    for (let i = 0; i < 20; i++) {
        const li = document.createElement("li");
        li.className = "list-track-item";
        li.innerHTML = `
            <div class="position">
                <p class="position-value">${i + 1}</p>
            </div>
            <div class="info">
                <p class="title">extremely long title way too long #${i + 1}</p>
                <p class="author">author ${i + 1}</p>
            </div>
            <div class="duration">
                <p class="duration-value">${Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}</p>
            </div>
            <div class="actions">
                <button class="queue-track normal-button">
                    <i class="fa fa-plus-square"></i>
                </button>
                <button class="more-options normal-button">
                    <i class="fa fa-cog"></i>
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
        li.className = "list-track-item";
        li.setAttribute("tabindex", "0"); //make focusable
        li.innerHTML = `
            <div class="position">
                <p class="position-value">${i + 1}</p>
            </div>
            <div class="info">
                <p class="title">extremely long title way too long #${i + 1}</p>
                <p class="author">author ${i + 1}</p>
            </div>
            <div class="duration">
                <p class="duration-value">${Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}</p>
            </div>
            <div class="actions">
                <button class="queue-track normal-button">
                    <i class="fa fa-plus-square"></i>
                </button>
                <button class="more-options normal-button">
                    <i class="fa fa-cog"></i>
                </button>
                <button class="remove-track normal-button">
                    <i class="fa fa-trash"></i>
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