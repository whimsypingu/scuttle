// debug.js
export let DEBUG_ENABLED = false;

export function setDebugEnabled(enabled) {
    DEBUG_ENABLED = enabled;

    const el = document.getElementById("debug-log");
    if (el) {
        el.style.display = enabled ? "block" : "none";
    }
}

export function logDebug(...args) {
    if (!DEBUG_ENABLED) return;

    // write to debug log div if it exists
    const el = document.getElementById("debug-log");
    if (el) {
        const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
        el.textContent += msg + "\n";
        el.scrollTop = el.scrollHeight;
    }
    // always log to console too
    console.log(...args);
}
