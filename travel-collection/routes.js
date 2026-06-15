const routeSearch = document.querySelector("[data-route-search]");
const routeResults = document.querySelector("[data-route-results]");
const routeSearchSummary = document.querySelector("[data-route-search-summary]");
const routeTabButtons = [...document.querySelectorAll("[data-route-tab]")];

let activeRouteTab = "跨国路线";

function readState() {
  return window.TravelState?.readTravelState?.() || {};
}

function updateState(updater) {
  return window.TravelState?.updateTravelState?.(updater) || {};
}

function routePlaceNames(route, state) {
  const countryNames = (route.countryIds || []).map((id) => state.countriesById?.[id]?.name || id).filter(Boolean);
  const cityNames = (route.cityIds || []).map((id) => state.citiesById?.[id]?.name || id).filter(Boolean);
  return {
    countries: countryNames,
    cities: cityNames,
    summary: routeKind(route) === "单国城市路线" ? cityNames.join(" · ") : countryNames.join(" · "),
  };
}

function routeKind(route) {
  return (route.countryIds || []).length <= 1 ? "单国城市路线" : route.kind;
}

function matchesRouteKeyword(route, keyword, state) {
  if (!keyword) return true;
  const places = routePlaceNames(route, state);
  const haystack = [
    route.name,
    route.reason,
    route.days,
    route.season,
    route.budgetLevel,
    ...(route.tags || []),
    route.searchText,
    ...places.countries,
    ...places.cities,
  ].join(" ");
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

function routeDetailHref(route) {
  return route.id === "nordic-aurora" ? "route-nordic.html" : `route-nordic.html#${route.id}`;
}

function buildRouteCards() {
  const state = readState();
  const keyword = (routeSearch?.value || "").trim();
  const routes = window.TravelSearch?.searchRoutes
    ? window.TravelSearch.searchRoutes(state, keyword, { kind: keyword ? "all" : activeRouteTab })
    : (state.routes || []).filter((route) => keyword || routeKind(route) === activeRouteTab).filter((route) => matchesRouteKeyword(route, keyword, state));
  return routes
    .filter((route) => keyword || routeKind(route) === activeRouteTab)
    .map((route) => ({ route, state }));
}

function cardImageSrc(src) {
  if (!src || !/^https:\/\/images\.unsplash\.com\//.test(src)) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", "560");
    url.searchParams.set("q", "62");
    return url.toString();
  } catch (error) {
    return src;
  }
}

function cardImageAttrs(index) {
  const isLeadImage = index < 2;
  return `loading="${isLeadImage ? "eager" : "lazy"}" decoding="async"${isLeadImage ? ' fetchpriority="high"' : ""}`;
}

function renderRouteCard({ route, state }, index = 0) {
  const places = routePlaceNames(route, state);
  const cover = cardImageSrc(route.cover);
  return `
    <article class="route-card route-inspiration-card" data-route-card="${route.id}">
      <button class="route-card-main" type="button" data-route-open="${route.id}">
        <img src="${cover}" alt="${route.name}封面图" ${cardImageAttrs(index)} />
        <span class="route-copy">
          <strong>${route.name}</strong>
          <em>${places.summary}</em>
          <small>${route.reason}</small>
        </span>
      </button>
      <div class="route-card-meta" aria-label="路线信息">
        <span>${route.days}</span>
        <span>${route.season}</span>
      </div>
      <div class="route-card-actions">
        <button type="button" data-route-add-trip="${route.id}">加入行程</button>
        <button class="${route.isFavorite ? "favorited" : ""}" type="button" data-route-favorite="${route.id}" aria-label="收藏${route.name}">♡</button>
      </div>
    </article>
  `;
}

function renderRoutes() {
  if (!routeResults) return;
  const keyword = (routeSearch?.value || "").trim();
  const items = buildRouteCards();
  if (routeSearchSummary) {
    routeSearchSummary.hidden = !keyword;
    routeSearchSummary.textContent = keyword ? `已找到 ${items.length} 条相关路线` : "";
  }
  routeResults.innerHTML = items.length
    ? items.map(renderRouteCard).join("")
    : `
      <div class="route-empty-state">
        <p>没有找到包含该城市的路线</p>
        <span>可以试试搜索其他城市或国家</span>
        <button type="button" data-route-clear-search>清空搜索</button>
      </div>
    `;
}

function routeById(routeId) {
  return readState().routesById?.[routeId];
}

function addRouteToTrip(routeId) {
  const route = routeById(routeId);
  if (!route) return;
  window.openAddToTripModal?.({
    type: "route",
    id: route.id,
    name: route.name,
    countryIds: route.countryIds || [],
    cityIds: route.cityIds || [],
  });
}

routeSearch?.addEventListener("input", renderRoutes);

routeTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeRouteTab = button.dataset.routeTab || "跨国路线";
    routeTabButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderRoutes();
  });
});

routeResults?.addEventListener("click", (event) => {
  const clearSearch = event.target.closest("[data-route-clear-search]");
  const open = event.target.closest("[data-route-open]");
  const add = event.target.closest("[data-route-add-trip]");
  const favorite = event.target.closest("[data-route-favorite]");

  if (clearSearch) {
    if (routeSearch) routeSearch.value = "";
    renderRoutes();
    routeSearch?.focus();
    return;
  }

  if (add) {
    addRouteToTrip(add.dataset.routeAddTrip);
    return;
  }
  if (favorite) {
    updateState((state) => {
      const favorites = new Set(state.favoriteRouteIds || []);
      const routeId = favorite.dataset.routeFavorite;
      if (favorites.has(routeId)) favorites.delete(routeId);
      else favorites.add(routeId);
      state.favoriteRouteIds = [...favorites];
      return state;
    });
    renderRoutes();
    return;
  }
  if (open) {
    const route = routeById(open.dataset.routeOpen);
    if (route) window.location.href = routeDetailHref(route);
  }
});

renderRoutes();
