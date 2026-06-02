const tripFilterButtons = [...document.querySelectorAll("[data-trip-filter]")];
const tripModal = document.querySelector("[data-trip-modal]");
const tripPanels = [...document.querySelectorAll("[data-trip-step]")];
const upcomingList = document.querySelector("[data-trip-list-upcoming]");
let tripStep = 1;

function tripCards() {
  return [...document.querySelectorAll("[data-trip-name]")];
}

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

function showTripStep(step) {
  tripStep = step;
  tripPanels.forEach((panel) => {
    panel.hidden = panel.dataset.tripStep !== String(step);
  });
}

function defaultTrip() {
  return {
    name: document.querySelector("[data-trip-name-input]")?.value || "北欧极光之旅",
    places: ["挪威", "冰岛", "芬兰"],
    start: document.querySelector("[data-trip-start-input]")?.value || "2026.07.18",
    end: document.querySelector("[data-trip-end-input]")?.value || "2026.07.30",
    days: "12天",
    countries: "3国",
    cover: "assets/trip-nordic-cover.svg",
  };
}

function tripDateRange(trip) {
  return `${trip.start} - ${trip.end.slice(5)}`;
}

function appendTripCard(trip) {
  if (!upcomingList) return;
  const card = document.createElement("button");
  card.className = "trip-card";
  card.type = "button";
  card.dataset.tripName = trip.name;
  card.dataset.tripStatus = "待出行";
  card.innerHTML = `
    <img src="${trip.cover}" alt="${trip.name}封面图" />
    <span class="trip-card-copy">
      <strong>${trip.name}</strong>
      <em>${trip.places.join(" · ")}</em>
      <small>${tripDateRange(trip)}</small>
      <small>${trip.days} · ${trip.countries}</small>
    </span>
    <span class="trip-status planning">规划中</span>
  `;
  upcomingList.prepend(card);
}

function updateTripPreview() {
  const trip = defaultTrip();
  const preview = document.querySelector("[data-trip-preview]");
  if (!preview) return;
  preview.querySelector("b").textContent = trip.name;
  preview.querySelector("em").textContent = trip.places.join(" · ");
  const small = preview.querySelectorAll("small");
  small[0].textContent = tripDateRange(trip);
  small[1].textContent = `${trip.days} · ${trip.countries}`;
}

tripFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.tripFilter || "全部";
    tripFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
    tripCards().forEach((card) => {
      const status = card.dataset.tripStatus || "";
      card.hidden = filter !== "全部" && filter !== "收藏" && status !== filter;
    });
  });
});

tripCards().forEach((card) => {
  card.addEventListener("click", () => {
    console.log(`open trip detail: ${card.dataset.tripName}`);
  });
});

document.querySelector("[data-new-trip]")?.addEventListener("click", () => {
  if (tripModal) tripModal.hidden = false;
  showTripStep(1);
});

document.querySelector("[data-close-trip-modal]")?.addEventListener("click", () => {
  if (tripModal) tripModal.hidden = true;
});

document.querySelectorAll("[data-trip-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (tripStep === 2) updateTripPreview();
    showTripStep(Math.min(tripStep + 1, 3));
  });
});

document.querySelectorAll("[data-trip-prev]").forEach((button) => {
  button.addEventListener("click", () => {
    showTripStep(Math.max(tripStep - 1, 1));
  });
});

document.querySelectorAll("[data-remove-place]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest("span")?.remove();
  });
});

document.querySelector("[data-add-place]")?.addEventListener("click", () => {
  const search = document.querySelector("[data-place-search]");
  const value = (search?.value || "").trim();
  if (!value) return;
  const list = document.querySelector(".trip-selected-list");
  const chipRow = document.querySelector(".trip-selected-chips");
  const item = document.createElement("span");
  item.innerHTML = `${value} <button type="button" data-remove-place="${value}">×</button>`;
  item.querySelector("button")?.addEventListener("click", () => item.remove());
  list?.append(item);
  const chip = document.createElement("button");
  chip.type = "button";
  chip.textContent = value;
  chipRow?.append(chip);
  search.value = "";
});

document.querySelector("[data-create-trip]")?.addEventListener("click", () => {
  const trip = defaultTrip();
  appendTripCard(trip);
  const state = readTravelState();
  state.nextTrip = trip;
  writeTravelState(state);
  if (tripModal) tripModal.hidden = true;
});
