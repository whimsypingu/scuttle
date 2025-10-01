export function hideBootLoadingOverlay() {
    const overlay = document.getElementById("boot-loading-overlay");

    overlay.classList.add('hidden');

    overlay.addEventListener('transitionend', () => {
        overlay.remove();
    });
}