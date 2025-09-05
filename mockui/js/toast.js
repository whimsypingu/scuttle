// function showToast(message) {
//     const container = document.getElementById("toast-container");

//     const toast = document.createElement("div");
//     toast.className = "toast";
//     toast.textContent = message;

//     container.appendChild(toast);

//     // Remove after animation ends
//     toast.addEventListener("animationend", (e) => {
//         if (e.animationName === "toast-out") {
//             toast.remove();
//         }
//     });
// }

// document.addEventListener("click", () => {
//     showToast("New toast at " + new Date().toLocaleTimeString());
// });


function showToast(message, duration = 3000) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, duration);
}


const testMessages = [
  "Short",
  "Medium length toast message",
  "This is a much longer toast message that should wrap nicely onto multiple lines without breaking the layout or overflowing off the screen"
];

document.addEventListener("click", () => {
  const msg = testMessages[Math.floor(Math.random() * testMessages.length)];
  showToast(msg);
});
