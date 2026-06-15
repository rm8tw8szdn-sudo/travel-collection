const countryCode = normalizeCountryHash();
const exploreToggle = document.querySelector("[data-explore-toggle]");
const exploreToggleText = exploreToggle?.querySelector("span");
const exploreModal = document.querySelector("[data-explore-modal]");
const visitRecord = document.querySelector("[data-visit-record]");
const recordMenu = document.querySelector("[data-record-menu]");

function normalizeCountryHash() {
  const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return (raw.replace(/^country-/, "") || document.querySelector("[data-explore-toggle]")?.dataset.countryCode || "JP").toUpperCase();
}

function readTravelState() {
  return window.TravelState?.readTravelState?.() || {};
}

function updateTravelState(updater) {
  return window.TravelState?.updateTravelState?.(updater) || {};
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusLabel(status) {
  if (status === "explored") return "已去";
  if (status === "planned") return "待出行";
  return "未去";
}

function currentCountry(state = readTravelState()) {
  return state.countriesById?.[countryCode] || state.countriesById?.JP;
}

function renderCountry() {
  const state = readTravelState();
  const country = currentCountry(state);
  if (!country) return;
  document.title = `${country.name} · 国家详情`;
  document.querySelector(".country-screen")?.setAttribute("aria-label", `${country.name}国家详情`);
  document.querySelector(".country-hero")?.setAttribute("aria-label", country.name);
  const heroImage = document.querySelector(".country-hero-image");
  if (heroImage) {
    heroImage.src = country.cover || "assets/home-aurora-cover.svg";
    heroImage.alt = `${country.name}封面图`;
  }
  document.querySelector(".country-hero-copy h1")?.replaceChildren(country.name);
  document.querySelector(".country-hero-copy p")?.replaceChildren(`${country.continent || "目的地"}  |  ${(country.tags || []).slice(0, 3).join(" · ")}`);
  document.querySelector(".country-intro")?.replaceChildren(country.intro || country.description || "");
  document.querySelector("[data-country-tags]")?.replaceChildren(...(country.tags || []).slice(0, 5).map((tag) => {
    const node = document.createElement("span");
    node.textContent = tag;
    return node;
  }));
  const meta = document.querySelector("[data-country-trip-meta]");
  if (meta) {
    meta.innerHTML = `
      <span><em>推荐天数</em><strong>${escapeHtml(country.recommendedDays || "待补充")}</strong></span>
      <span><em>最佳季节</em><strong>${escapeHtml(country.bestSeason || "按路线季节")}</strong></span>
      <span><em>预算</em><strong>${escapeHtml(country.budgetLevel || "中等")}</strong></span>
    `;
  }
  document.querySelectorAll("[data-add-country-id]").forEach((button) => {
    button.dataset.addCountryId = country.id;
  });
  if (exploreToggle) exploreToggle.dataset.countryCode = country.id;
  renderExploredState(country.explorationStatus);
  renderFavoriteState(country.isFavorite);
  renderCities(country, state);
  renderSpots(country);
  renderRoutes(country, state);
}

function renderCities(country, state) {
  const list = document.querySelector(".country-city-list");
  if (!list) return;
  const cities = (country.cityIds || [])
    .map((id) => state.citiesById?.[id])
    .filter(Boolean)
    .slice(0, 3);
  list.innerHTML = cities.map((city) => `
    <button class="country-mini-card" type="button" data-city-id="${escapeHtml(city.id)}">
      <img src="${escapeHtml(city.cover || country.cover)}" alt="${escapeHtml(city.name)}封面图" />
      <span></span>
      <strong>${escapeHtml(city.name)}</strong>
      <em>${escapeHtml(statusLabel(city.explorationStatus))}</em>
    </button>
  `).join("") || `<p class="atlas-empty">暂无推荐城市</p>`;
}

function countryRecommendedCities(country, state, limit = 12) {
  return (country.cityIds || [])
    .map((id) => state.citiesById?.[id])
    .filter(Boolean)
    .slice(0, limit);
}

function ensureCountryCityGalleryRoot() {
  let root = document.querySelector("[data-country-city-gallery-root]");
  if (root) return root;
  root = document.createElement("div");
  root.setAttribute("data-country-city-gallery-root", "");
  document.querySelector(".country-screen")?.append(root);
  return root;
}

function openCountryCityGallery() {
  const state = readTravelState();
  const country = currentCountry(state);
  if (!country) return;
  const root = ensureCountryCityGalleryRoot();
  const cities = countryRecommendedCities(country, state);
  root.innerHTML = `
    <section class="country-city-gallery" role="dialog" aria-modal="true" aria-label="${escapeHtml(country.name)}推荐城市">
      <header class="country-city-gallery-head">
        <button type="button" aria-label="返回国家详情" data-country-city-gallery-close>‹</button>
        <span>
          <strong>推荐城市</strong>
          <em>${escapeHtml(country.name)} · ${cities.length} 个城市</em>
        </span>
      </header>
      <div class="country-city-gallery-grid">
        ${cities.map((city) => `
          <button class="country-city-gallery-card" type="button" data-city-id="${escapeHtml(city.id)}">
            <img src="${escapeHtml(city.cover || country.cover)}" alt="${escapeHtml(city.name)}封面图" />
            <span></span>
            <strong>${escapeHtml(city.name)}</strong>
            <em>${escapeHtml(city.englishName || statusLabel(city.explorationStatus))}</em>
          </button>
        `).join("") || `<p class="atlas-empty">暂无推荐城市</p>`}
      </div>
    </section>
  `;
  root.hidden = false;
}

function closeCountryCityGallery() {
  const root = document.querySelector("[data-country-city-gallery-root]");
  if (root) {
    root.hidden = true;
    root.innerHTML = "";
  }
}

function countryRelatedRoutes(country, state, limit = Infinity) {
  const routes = (country.routeIds || [])
    .map((id) => state.routesById?.[id])
    .filter(Boolean);
  return Number.isFinite(limit) ? routes.slice(0, limit) : routes;
}

function ensureCountryRouteGalleryRoot() {
  let root = document.querySelector("[data-country-route-gallery-root]");
  if (root) return root;
  root = document.createElement("div");
  root.setAttribute("data-country-route-gallery-root", "");
  document.querySelector(".country-screen")?.append(root);
  return root;
}

function openCountryRouteGallery() {
  const state = readTravelState();
  const country = currentCountry(state);
  if (!country) return;
  const root = ensureCountryRouteGalleryRoot();
  const routes = countryRelatedRoutes(country, state);
  root.innerHTML = `
    <section class="country-city-gallery country-route-gallery" role="dialog" aria-modal="true" aria-label="${escapeHtml(country.name)}相关路线">
      <header class="country-city-gallery-head">
        <button type="button" aria-label="返回国家详情" data-country-route-gallery-close>‹</button>
        <span>
          <strong>相关路线</strong>
          <em>${escapeHtml(country.name)} · ${routes.length} 条路线</em>
        </span>
      </header>
      <div class="country-route-gallery-grid">
        ${routes.map((route) => `
          <button class="country-route-gallery-card" type="button" data-route-id="${escapeHtml(route.id)}">
            <img src="${escapeHtml(route.cover || country.cover)}" alt="${escapeHtml(route.name)}封面图" />
            <span></span>
            <strong>${escapeHtml(route.name)}</strong>
            <em>${escapeHtml(route.days || "天数待定")} · ${escapeHtml(route.budgetLevel || "中等")}</em>
          </button>
        `).join("") || `<p class="atlas-empty">暂无相关路线</p>`}
      </div>
    </section>
  `;
  root.hidden = false;
}

function closeCountryRouteGallery() {
  const root = document.querySelector("[data-country-route-gallery-root]");
  if (root) {
    root.hidden = true;
    root.innerHTML = "";
  }
}

function renderSpots(country) {
  const spots = document.querySelector("[data-country-spots]");
  if (!spots) return;
  spots.innerHTML = (country.spots || []).slice(0, 5).map((spot) => `<span>${escapeHtml(spot)}</span>`).join("");
}

function renderRoutes(country, state) {
  const list = document.querySelector(".country-route-list");
  if (!list) return;
  const routes = (country.routeIds || [])
    .map((id) => state.routesById?.[id])
    .filter(Boolean)
    .slice(0, 4);
  list.innerHTML = routes.map((route) => `
    <button class="country-route-card" type="button" data-route-id="${escapeHtml(route.id)}">
      <img src="${escapeHtml(route.cover || country.cover)}" alt="${escapeHtml(route.name)}封面图" />
      <span></span>
      <strong>${escapeHtml(route.name)}</strong>
      <em>${escapeHtml(route.days || "天数待定")} · ${(route.cityIds || []).length || (route.countryIds || []).length}站</em>
    </button>
  `).join("") || `<p class="atlas-empty">暂无相关路线</p>`;
}

function setExplored(isExplored) {
  const nextState = updateTravelState((state) => {
    const records = (state.manualVisitRecords || []).filter((record) => record.countryId !== countryCode);
    if (isExplored) {
      records.push({
        id: `manual-visit-${countryCode}`,
        countryId: countryCode,
        cityId: "",
        date: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
        note: "",
      });
    }
    state.manualVisitRecords = records;
    return state;
  });
  renderExploredState(nextState.countriesById?.[countryCode]?.explorationStatus || "unexplored");
}

function renderExploredState(status) {
  if (exploreToggleText) exploreToggleText.textContent = statusLabel(status);
  exploreToggle?.classList.toggle("visited", status === "explored");
  if (visitRecord) visitRecord.hidden = status !== "explored";
  if (recordMenu) recordMenu.hidden = true;
}

function renderFavoriteState(isFavorite) {
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.classList.toggle("favorited", Boolean(isFavorite));
    button.setAttribute("aria-pressed", String(Boolean(isFavorite)));
  });
}

document.querySelector("[data-back]")?.addEventListener("click", () => {
  window.location.href = "atlas.html";
});

exploreToggle?.addEventListener("click", () => {
  const state = readTravelState();
  const country = currentCountry(state);
  if (country?.explorationStatus !== "explored" && exploreModal) exploreModal.hidden = false;
});

document.querySelector("[data-save-explore]")?.addEventListener("click", () => {
  if (exploreModal) exploreModal.hidden = true;
  setExplored(true);
});

document.querySelector("[data-record-more]")?.addEventListener("click", () => {
  if (recordMenu) recordMenu.hidden = false;
});

document.querySelector("[data-mark-unvisited]")?.addEventListener("click", () => setExplored(false));
document.querySelector("[data-delete-record]")?.addEventListener("click", () => setExplored(false));
document.querySelector("[data-edit-record]")?.addEventListener("click", () => {
  if (recordMenu) recordMenu.hidden = true;
  if (exploreModal) exploreModal.hidden = false;
});

document.querySelectorAll("[data-favorite]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextState = updateTravelState((state) => {
      const favorites = new Set(state.favoriteCountryIds || []);
      if (favorites.has(countryCode)) favorites.delete(countryCode);
      else favorites.add(countryCode);
      state.favoriteCountryIds = [...favorites];
      return state;
    });
    renderFavoriteState(nextState.countriesById?.[countryCode]?.isFavorite);
  });
});

document.querySelector(".country-city-list")?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-city-id]");
  if (card) window.location.href = `city-oslo.html#${encodeURIComponent(card.dataset.cityId)}`;
});

document.querySelector("[data-country-city-gallery]")?.addEventListener("click", (event) => {
  event.preventDefault();
  openCountryCityGallery();
});

document.querySelector("[data-country-route-gallery]")?.addEventListener("click", (event) => {
  event.preventDefault();
  openCountryRouteGallery();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-country-city-gallery-root]")) return;
  const close = event.target.closest("[data-country-city-gallery-close]");
  if (close) {
    closeCountryCityGallery();
    return;
  }
  const card = event.target.closest("[data-city-id]");
  if (card) window.location.href = `city-oslo.html#${encodeURIComponent(card.dataset.cityId)}`;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-country-route-gallery-root]")) return;
  const close = event.target.closest("[data-country-route-gallery-close]");
  if (close) {
    closeCountryRouteGallery();
    return;
  }
  const card = event.target.closest("[data-route-id]");
  if (card) window.location.href = `route-nordic.html#${encodeURIComponent(card.dataset.routeId)}`;
});

document.querySelector(".country-route-list")?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-route-id]");
  if (card) window.location.href = `route-nordic.html#${encodeURIComponent(card.dataset.routeId)}`;
});

document.querySelector("[data-add-to-trip]")?.addEventListener("click", () => {
  const state = readTravelState();
  const country = currentCountry(state);
  if (!country) return;
  window.openAddToTripModal?.({
    type: "country",
    id: country.id,
    name: country.name,
    countryIds: [country.id],
    cityIds: [],
  });
});

document.querySelectorAll("[data-share]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const state = readTravelState();
    const country = currentCountry(state);
    window.openShareCard?.("country", {
      name: country.name,
      cover: country.cover,
      description: country.intro,
      meta: `${country.continent || "目的地"} · ${state.userProfile?.nickname || "旅行者"}`,
    });
  });
});

renderCountry();
