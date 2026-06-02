document.querySelector("[data-profile-edit]")?.addEventListener("click", () => {
  window.location.hash = "profile-edit";
});

document.querySelector("[data-favorites-page]")?.addEventListener("click", () => {
  window.location.href = "favorites.html";
});

document.querySelectorAll("[data-footprint-page]").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = "footprint.html";
  });
});

function readTravelState() {
  try {
    return JSON.parse(localStorage.getItem("travelCollectionState") || "{}");
  } catch {
    return {};
  }
}

function hydrateProfileStats() {
  const state = readTravelState();
  const stats = document.querySelectorAll(".profile-stats strong");
  if (stats[0] && state.exploredCountryCount) stats[0].textContent = String(state.exploredCountryCount);
  if (stats[2] && state.footprintCount) stats[2].textContent = String(state.footprintCount);
}

document.querySelectorAll("[data-profile-link]").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.hash = button.dataset.profileLink || "profile";
  });
});

hydrateProfileStats();
