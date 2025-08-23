// debug.js
export function logDebug(...args) {
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
