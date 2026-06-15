document.querySelector("[data-route-back]")?.addEventListener("click", () => {
  window.location.href = "routes.html";
});

const routeId = decodeURIComponent(window.location.hash.replace(/^#/, "")) || "nordic-aurora";
const favoriteButton = document.querySelector("[data-route-favorite]");
const addRouteButton = document.querySelector("[data-route-add-trip]");

function readState() {
  return window.TravelState?.readTravelState?.() || {};
}

function updateState(updater) {
  return window.TravelState?.updateTravelState?.(updater) || {};
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currentRoute(state = readState()) {
  return state.routesById?.[routeId] || state.routesById?.["nordic-aurora"];
}

function routePlaceNames(route, state) {
  return {
    countries: (route.countryIds || []).map((id) => state.countriesById?.[id]?.name || id),
    cities: (route.cityIds || []).map((id) => state.citiesById?.[id]?.name || id),
  };
}

function routeRecommendation(route, places) {
  const custom = {
    iberia: "推荐语：从巴塞罗那的现代主义建筑到马德里的博物馆，再到里斯本的山城海风，适合把城市、美食和海岸放在一趟轻量西葡线里。",
    "iberia-sunshine": "推荐语：西班牙与葡萄牙的老城、海岸阳光和慢节奏餐桌连在一起，适合春秋季做 9-12 天的西葡长一点路线。",
    "spain-art-andalusia": "推荐语：巴塞罗那建筑、马德里博物馆和塞维利亚宫殿各有重点，适合想集中收集西班牙艺术与历史的人。",
    "france-spain-art-coast": "推荐语：巴黎和南法提供博物馆与海岸，巴塞罗那、塞维利亚补上建筑和南欧城市感，适合艺术海岸主题。",
    "nordic-aurora": "推荐语：把挪威峡湾、冰岛自然和芬兰冬季体验放在一起，适合第一次规划北欧极光主题旅行。",
  };
  if (custom[route.id]) return custom[route.id];
  const cityText = places.cities.slice(0, 3).join("、");
  const countryText = places.countries.slice(0, 3).join("、");
  const themeText = (route.tags || []).slice(0, 3).join("、");
  const placeText = route.kind === "单国城市路线" && cityText ? cityText : countryText;
  return `推荐语：${placeText || route.name}围绕${themeText || "目的地特色"}展开，${route.reason || "适合按兴趣组合成一趟轻量路线。"}`;
}

function renderRouteDetailState() {
  const state = readState();
  const route = currentRoute(state);
  if (!route) return;
  const places = routePlaceNames(route, state);
  document.title = `${route.name} · 路线详情`;
  document.querySelector(".route-detail-screen")?.setAttribute("aria-label", `${route.name}路线详情`);
  const hero = document.querySelector(".route-detail-hero img");
  if (hero) {
    hero.src = route.cover || "assets/home-aurora-cover.svg";
    hero.alt = `${route.name}封面图`;
  }
  document.querySelector("[data-route-name]")?.replaceChildren(route.name);
  document.querySelector("[data-route-places]")?.replaceChildren(route.kind === "单国城市路线" ? places.cities.join(" · ") : places.countries.join(" · "));
  document.querySelector("[data-route-reason]")?.replaceChildren(routeRecommendation(route, places));
  renderHighlightText(route, places);
  document.querySelector("[data-route-days]")?.replaceChildren(route.days || "待定");
  document.querySelector("[data-route-season]")?.replaceChildren(route.season || "按季节");
  document.querySelector("[data-route-budget]")?.replaceChildren(route.budgetLevel || "中等");
  if (addRouteButton) addRouteButton.dataset.routeAddTrip = route.id;
  favoriteButton?.classList.toggle("favorited", route.isFavorite);
  favoriteButton?.setAttribute("aria-pressed", String(route.isFavorite));
  renderCities(route, state);
  renderRelated(route, state);
}

function routeHighlightSentence(route, places) {
  const tags = (route.tags || []).slice(0, 4);
  const cityText = places.cities.slice(0, 3).join("、");
  const countryText = places.countries.slice(0, 3).join("、");
  const placeText = route.kind === "单国城市路线" && cityText ? cityText : countryText;
  const themeText = tags.length ? tags.join("、") : "目的地特色";
  const placePrefix = placeText ? `${placeText}串联` : "";
  return `路线亮点：${placePrefix}${themeText}主题，适合按兴趣和季节节奏轻量收集。`;
}

function renderHighlightText(route, places) {
  const node = document.querySelector("[data-route-highlight-text]");
  if (!node) return;
  node.textContent = routeHighlightSentence(route, places);
}

function renderCities(route, state) {
  const section = document.querySelector("[data-route-cities]");
  const grid = section?.querySelector(".route-city-grid");
  if (!grid) return;
  grid.innerHTML = (route.cityIds || []).slice(0, 6).map((id) => {
    const city = state.citiesById?.[id];
    const country = state.countriesById?.[city?.countryId] || {};
    if (!city) return "";
    const cover = city.cover || country.cover || "assets/home-aurora-cover.svg";
    return `
      <a class="route-city-card" href="city-oslo.html#${encodeURIComponent(city.id)}" data-city-link="${escapeHtml(city.id)}">
        <img src="${escapeHtml(cover)}" alt="${escapeHtml(city.name)}封面图" />
        <span></span>
        <strong>${escapeHtml(city.name)}</strong>
        <em>${escapeHtml(country.name || "")}</em>
      </a>
    `;
  }).join("");
}

function renderRelated(route, state) {
  const list = document.querySelector(".route-related-list");
  if (!list) return;
  const related = (state.routes || [])
    .filter((item) => item.id !== route.id && (item.countryIds || []).some((id) => (route.countryIds || []).includes(id)))
    .slice(0, 3);
  list.innerHTML = related.map((item) => `
    <a href="route-nordic.html#${encodeURIComponent(item.id)}" data-related-route="${escapeHtml(item.id)}">
      <img src="${escapeHtml(item.cover || "assets/home-aurora-cover.svg")}" alt="${escapeHtml(item.name)}封面图" />
      <span><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(item.days || "天数待定")} · ${escapeHtml(item.budgetLevel || "中等")}</em></span>
    </a>
  `).join("") || `<p class="atlas-empty">暂无相关路线</p>`;
}

favoriteButton?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  const route = currentRoute();
  const nextState = updateState((state) => {
    const favorites = new Set(state.favoriteRouteIds || []);
    if (favorites.has(route.id)) favorites.delete(route.id);
    else favorites.add(route.id);
    state.favoriteRouteIds = [...favorites];
    return state;
  });
  const isFavorited = nextState.routesById?.[route.id]?.isFavorite;
  button.classList.toggle("favorited", isFavorited);
  button.setAttribute("aria-pressed", String(isFavorited));
});

addRouteButton?.addEventListener("click", () => {
  const route = currentRoute();
  window.openAddToTripModal?.({
    type: "route",
    id: route.id,
    name: route.name,
    countryIds: route.countryIds || [],
    cityIds: route.cityIds || [],
  });
});

renderRouteDetailState();
