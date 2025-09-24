export function showToast(message, duration = 3000) {
    const container = document.getElementById("toast");

    const toast = document.createElement("div");
    toast.className = "toast-content";
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
        toast.classList.remove("show");
    }, duration);
}
