const cityId = decodeURIComponent(window.location.hash.replace(/^#/, "")) || "NO-OSL";
const cityName = document.querySelector("[data-city-name]");
const cityCountry = document.querySelector("[data-city-country]");
const cityIntro = document.querySelector("[data-city-intro]");
const cityCover = document.querySelector("[data-city-cover]");
const cityTags = document.querySelector("[data-city-tags]");
const citySpots = document.querySelector("[data-city-spots]");
const favoriteButton = document.querySelector("[data-city-favorite]");
const markExploredButton = document.querySelector("[data-city-mark-explored]");
const addTripButton = document.querySelector("[data-city-add-trip]");

function readState() {
  return window.TravelState?.readTravelState?.() || {};
}

function updateState(updater) {
  return window.TravelState?.updateTravelState?.(updater) || {};
}

function currentCity(state = readState()) {
  return state.citiesById?.[cityId] || state.citiesById?.["NO-OSL"];
}

function renderCity() {
  const state = readState();
  const city = currentCity(state);
  const country = state.countriesById?.[city.countryId] || {};
  if (cityName) cityName.textContent = city.name;
  if (cityCountry) cityCountry.textContent = country.name || "";
  if (cityIntro) cityIntro.textContent = city.intro || "";
  if (cityCover) {
    cityCover.src = city.cover || country.cover || "assets/route-city-oslo.svg";
    cityCover.alt = `${city.name}封面图`;
  }
  if (cityTags) {
    cityTags.innerHTML = (city.tags || []).map((tag) => `<span>${tag}</span>`).join("");
  }
  if (citySpots) {
    citySpots.innerHTML = (city.spots || []).slice(0, 5).map((spot) => `<span>${spot}</span>`).join("");
  }
  favoriteButton?.classList.toggle("favorited", city.isFavorite);
  if (markExploredButton) markExploredButton.textContent = city.explorationStatus === "explored" ? "已探索" : "标记已探索";
}

favoriteButton?.addEventListener("click", () => {
  updateState((state) => {
    const favorites = new Set(state.favoriteCityIds || []);
    if (favorites.has(cityId)) favorites.delete(cityId);
    else favorites.add(cityId);
    state.favoriteCityIds = [...favorites];
    return state;
  });
  renderCity();
});

markExploredButton?.addEventListener("click", () => {
  updateState((state) => {
    const city = currentCity(state);
    const records = (state.manualVisitRecords || []).filter((record) => record.cityId !== cityId);
    records.push({
      id: `manual-visit-${cityId}`,
      countryId: city.countryId,
      cityId,
      date: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
      note: "",
    });
    state.manualVisitRecords = records;
    return state;
  });
  renderCity();
});

addTripButton?.addEventListener("click", () => {
  const state = readState();
  const city = currentCity(state);
  window.openAddToTripModal?.({
    type: "city",
    id: city.id,
    name: city.name,
    countryIds: [city.countryId],
    cityIds: [city.id],
  });
});

document.querySelectorAll("[data-city-share]").forEach((button) => {
  button.addEventListener("click", () => {
    const state = readState();
    const city = currentCity(state);
    const country = state.countriesById?.[city.countryId] || {};
    window.openShareCard?.("city", {
      name: city.name,
      cover: city.cover || country.cover,
      description: city.intro,
      meta: `${country.name || ""} · 城市`,
    });
  });
});

renderCity();
