const routeSearch = document.querySelector("[data-route-search]");
const routeResults = document.querySelector("[data-route-results]");
const routeSearchSummary = document.querySelector("[data-route-search-summary]");
const routeTabButtons = [...document.querySelectorAll("[data-route-tab]")];

let activeRouteTab = "跨国路线";
let onlineSearchStatus = "idle";
let onlineSearchQuery = "";
let onlineCandidates = [];
let onlineSearchToken = 0;

function readState() {
  return window.TravelState?.readTravelState?.() || {};
}

function updateState(updater) {
  return window.TravelState?.updateTravelState?.(updater) || {};
}

function routePlaceNames(route, state) {
  const countryNames = (route.countryIds || []).map((id) => state.countriesById?.[id]?.name || id).filter(Boolean);
  const cityNames = [
    ...(route.cityIds || []).map((id) => state.citiesById?.[id]?.name || id),
    ...(route.cityNames || []),
    ...(route.candidateCityNames || []),
  ].filter(Boolean);
  return {
    countries: [...new Set(countryNames)],
    cities: [...new Set(cityNames)],
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
    route.description,
    route.reason,
    route.days,
    route.season,
    route.budgetLevel,
    ...(route.tags || []),
    ...(route.keywords || []),
    ...(route.countries || []),
    ...(route.cities || []),
    ...(route.cityNames || []),
    ...(route.candidateCityNames || []),
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

function candidateSummary(candidate) {
  return (candidate.cities || []).length ? candidate.cities.join(" · ") : (candidate.countries || []).join(" · ");
}

function candidateBudgetLabel(value) {
  if (value === "low") return "低";
  if (value === "high") return "中高";
  if (value === "medium") return "中等";
  return value || "中等";
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

function renderCandidateCard(candidate, index = 0) {
  const state = readState();
  const route = window.TravelState?.routeFromCandidate?.(candidate, state);
  const cover = cardImageSrc(route?.cover || window.TravelState?.DEFAULT_TRIP_COVER || "assets/home-aurora-cover.svg");
  return `
    <article class="route-card route-inspiration-card route-candidate-card" data-route-candidate-card="${candidate.id}">
      <button class="route-card-main" type="button" data-route-candidate-preview="${candidate.id}">
        <img src="${cover}" alt="${candidate.name}封面图" ${cardImageAttrs(index)} />
        <span class="route-copy">
          <span class="route-candidate-label">联网发现</span>
          <strong>${candidate.name}</strong>
          <em>${candidateSummary(candidate)}</em>
          <small>${candidate.description}</small>
        </span>
      </button>
      <div class="route-card-meta" aria-label="候选路线信息">
        <span>${candidate.recommendedDays}</span>
        <span>${candidate.bestSeason}</span>
        <span>${candidateBudgetLabel(candidate.budgetLevel)}</span>
      </div>
      <div class="route-card-actions route-candidate-actions">
        <button type="button" data-route-candidate-add="${candidate.id}">加入行程</button>
        <button type="button" data-route-candidate-favorite="${candidate.id}">收藏</button>
        <button type="button" data-route-save-candidate="${candidate.id}">保存到路线库</button>
      </div>
    </article>
  `;
}

function renderOnlineEmptyState() {
  return `
    <div class="route-empty-state">
      <p>没有找到相关路线灵感</p>
      <span>可以换个国家、城市或主题试试</span>
      <button type="button" data-route-clear-search>清空搜索</button>
    </div>
  `;
}

function renderOnlineLoadingState() {
  return `
    <div class="route-empty-state">
      <p>本地路线库暂无相关路线，正在联网查找灵感…</p>
      <span>候选路线只会临时展示，保存前不会写入路线库。</span>
    </div>
  `;
}

function renderRoutes() {
  if (!routeResults) return;
  const keyword = (routeSearch?.value || "").trim();
  const items = buildRouteCards();
  if (routeSearchSummary) {
    routeSearchSummary.hidden = !keyword;
    if (!keyword) routeSearchSummary.textContent = "";
    else if (items.length) routeSearchSummary.textContent = `已找到 ${items.length} 条相关路线`;
    else if (onlineSearchStatus === "loading") routeSearchSummary.textContent = "本地路线库暂无相关路线，正在联网查找灵感…";
    else if (onlineSearchStatus === "ready" && onlineCandidates.length) routeSearchSummary.textContent = `联网发现 ${onlineCandidates.length} 条候选路线`;
    else routeSearchSummary.textContent = "";
  }
  if (items.length) {
    routeResults.innerHTML = items.map(renderRouteCard).join("");
    return;
  }
  if (keyword && onlineSearchStatus === "loading") {
    routeResults.innerHTML = renderOnlineLoadingState();
    return;
  }
  if (keyword && onlineSearchStatus === "ready" && onlineCandidates.length) {
    routeResults.innerHTML = onlineCandidates.map(renderCandidateCard).join("");
    return;
  }
  routeResults.innerHTML = keyword && onlineSearchStatus === "ready"
    ? renderOnlineEmptyState()
    : `
      <div class="route-empty-state">
        <p>没有找到包含该城市的路线</p>
        <span>可以试试搜索其他城市或国家</span>
        <button type="button" data-route-clear-search>清空搜索</button>
      </div>
    `;
}

function resetOnlineSearch() {
  onlineSearchStatus = "idle";
  onlineSearchQuery = "";
  onlineCandidates = [];
  onlineSearchToken += 1;
}

async function searchOnlineIfNeeded() {
  const keyword = (routeSearch?.value || "").trim();
  const localItems = buildRouteCards();
  if (!keyword || localItems.length) {
    resetOnlineSearch();
    renderRoutes();
    return;
  }
  if (onlineSearchStatus === "loading" && onlineSearchQuery === keyword) return;
  onlineSearchStatus = "loading";
  onlineSearchQuery = keyword;
  onlineCandidates = [];
  const token = ++onlineSearchToken;
  renderRoutes();
  const candidates = await (window.RouteCandidate?.searchOnlineRouteCandidates?.(keyword) || Promise.resolve([]));
  if (token !== onlineSearchToken || (routeSearch?.value || "").trim() !== keyword) return;
  onlineSearchStatus = "ready";
  onlineCandidates = candidates;
  renderRoutes();
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

function candidateById(candidateId) {
  return onlineCandidates.find((candidate) => candidate.id === candidateId);
}

function candidatePayload(candidate) {
  const state = readState();
  const route = window.TravelState?.routeFromCandidate?.(candidate, state);
  return {
    type: "candidate",
    id: candidate.id,
    name: candidate.name,
    countryIds: route?.countryIds || [],
    cityIds: route?.cityIds || [],
  };
}

function saveCandidate(candidateId, options = {}) {
  const candidate = candidateById(candidateId);
  if (!candidate) return null;
  const current = readState();
  const duplicate = window.TravelState?.findSimilarRoute?.(current, candidate);
  if (duplicate) {
    window.alert?.("路线库中已有相似路线");
    return duplicate;
  }
  const nextState = updateState((state) => window.TravelState.saveRouteCandidate(state, candidate, options));
  const routeId = nextState.lastRouteCandidateSave?.routeId;
  renderRoutes();
  return nextState.routesById?.[routeId] || null;
}

function favoriteCandidate(candidateId) {
  const route = saveCandidate(candidateId, { favorite: true });
  if (route?.id) window.alert?.("已保存并收藏路线");
}

function saveCandidateToLibrary(candidateId) {
  const route = saveCandidate(candidateId);
  if (route?.id) window.alert?.("已保存到路线库");
}

function addCandidateToTrip(candidateId) {
  const candidate = candidateById(candidateId);
  if (!candidate) return;
  window.openAddToTripModal?.(candidatePayload(candidate));
}

routeSearch?.addEventListener("input", () => {
  resetOnlineSearch();
  renderRoutes();
  searchOnlineIfNeeded();
});

routeTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeRouteTab = button.dataset.routeTab || "跨国路线";
    routeTabButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderRoutes();
    searchOnlineIfNeeded();
  });
});

routeResults?.addEventListener("click", (event) => {
  const clearSearch = event.target.closest("[data-route-clear-search]");
  const open = event.target.closest("[data-route-open]");
  const add = event.target.closest("[data-route-add-trip]");
  const favorite = event.target.closest("[data-route-favorite]");
  const addCandidate = event.target.closest("[data-route-candidate-add]");
  const favoriteCandidateButton = event.target.closest("[data-route-candidate-favorite]");
  const saveCandidateButton = event.target.closest("[data-route-save-candidate]");

  if (clearSearch) {
    if (routeSearch) routeSearch.value = "";
    resetOnlineSearch();
    renderRoutes();
    routeSearch?.focus();
    return;
  }

  if (addCandidate) {
    addCandidateToTrip(addCandidate.dataset.routeCandidateAdd);
    return;
  }
  if (favoriteCandidateButton) {
    favoriteCandidate(favoriteCandidateButton.dataset.routeCandidateFavorite);
    return;
  }
  if (saveCandidateButton) {
    saveCandidateToLibrary(saveCandidateButton.dataset.routeSaveCandidate);
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
