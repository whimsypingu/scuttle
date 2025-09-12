const searchInput = document.getElementById("search-input");
const recentContainer = document.getElementById("recent-searches");

searchInput.addEventListener("focus", () => {
  recentContainer.classList.add("expanded");
});

searchInput.addEventListener("blur", () => {
  // small delay so click events on list items still register
  setTimeout(() => {
    recentContainer.classList.remove("expanded");
  }, 150);
});
