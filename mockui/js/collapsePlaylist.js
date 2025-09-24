function collapsePlaylist() {
    document.querySelectorAll(".playlist").forEach((playlist) => {
        const header = playlist.querySelector(".playlist-header");

        header.addEventListener("click", () => {
            const isExpanded = playlist.classList.contains("expanded");

            if (!isExpanded) {
                const rect = playlist.getBoundingClientRect();
                const scrollTop = window.scrollY;
                const offset = rect.top + scrollTop;

                const translateY = -rect.top;
                playlist.style.transform = `translateY(${translateY}px)`;

                document.body.style.overflowY = "hidden";
            } else {
                playlist.style.transform = "";

                document.body.style.overflowY = "auto";
            }

            playlist.classList.toggle("expanded");
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    collapsePlaylist();
});