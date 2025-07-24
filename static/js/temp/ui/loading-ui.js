//static/js/ui/loading-ui.js

export function showLoading() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.style.display = "flex";
}

export function hideLoading() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.style.display = "none";
}