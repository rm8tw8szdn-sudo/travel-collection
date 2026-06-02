document.querySelector("[data-back]")?.addEventListener("click", () => {
  window.location.href = "atlas.html";
});

const countryCode = document.querySelector("[data-explore-toggle]")?.dataset.countryCode || "JP";
const exploreToggle = document.querySelector("[data-explore-toggle]");
const exploreToggleText = exploreToggle?.querySelector("span");
const exploreModal = document.querySelector("[data-explore-modal]");
const visitRecord = document.querySelector("[data-visit-record]");
const recordMenu = document.querySelector("[data-record-menu]");

function readTravelState() {
  try {
    return JSON.parse(localStorage.getItem("travelCollectionState") || "{}");
  } catch {
    return {};
  }
}

function writeTravelState(nextState) {
  localStorage.setItem("travelCollectionState", JSON.stringify(nextState));
}

function completedTripStillExplored(code) {
  const state = readTravelState();
  return Array.isArray(state.completedExploredCountries) && state.completedExploredCountries.includes(code);
}

function setExplored(isExplored) {
  const state = readTravelState();
  const exploredCountries = new Set(state.exploredCountries || []);
  if (isExplored) {
    exploredCountries.add(countryCode);
    state.exploredCountryCount = 12;
    state.footprintCount = Math.max(Number(state.footprintCount || 45), 46);
  } else if (!completedTripStillExplored(countryCode)) {
    exploredCountries.delete(countryCode);
    state.exploredCountryCount = 11;
    state.footprintCount = 45;
  }
  state.exploredCountries = [...exploredCountries];
  writeTravelState(state);
  renderExploredState(exploredCountries.has(countryCode));
}

function renderExploredState(isExplored) {
  if (exploreToggleText) exploreToggleText.textContent = isExplored ? "已去" : "未去";
  exploreToggle?.classList.toggle("visited", isExplored);
  if (visitRecord) visitRecord.hidden = !isExplored;
  if (recordMenu) recordMenu.hidden = true;
}

function hydrateExploredState() {
  const state = readTravelState();
  const exploredCountries = new Set(state.exploredCountries || []);
  renderExploredState(exploredCountries.has(countryCode));
}

exploreToggle?.addEventListener("click", () => {
  const isVisited = exploreToggle.classList.contains("visited");
  if (!isVisited && exploreModal) exploreModal.hidden = false;
});

document.querySelector("[data-save-explore]")?.addEventListener("click", () => {
  if (exploreModal) exploreModal.hidden = true;
  setExplored(true);
});

document.querySelector("[data-record-more]")?.addEventListener("click", () => {
  if (recordMenu) recordMenu.hidden = false;
});

document.querySelector("[data-mark-unvisited]")?.addEventListener("click", () => {
  setExplored(false);
});

document.querySelector("[data-delete-record]")?.addEventListener("click", () => {
  setExplored(false);
});

document.querySelector("[data-edit-record]")?.addEventListener("click", () => {
  if (recordMenu) recordMenu.hidden = true;
  if (exploreModal) exploreModal.hidden = false;
});

document.querySelectorAll("[data-favorite]").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("favorited");
  });
});

document.querySelectorAll("[data-city]").forEach((card) => {
  card.addEventListener("click", () => {
    if (!card.matches("[data-share-card-trigger]")) {
      console.log(`open city detail: ${card.dataset.city}`);
    }
  });
});

document.querySelectorAll("[data-route]").forEach((card) => {
  card.addEventListener("click", () => {
    console.log(`open route detail: ${card.dataset.route}`);
  });
});

hydrateExploredState();
