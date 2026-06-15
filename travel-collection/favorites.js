const favoriteTabs = [...document.querySelectorAll("[data-favorite-tab]")];
const favoriteSearch = document.querySelector("[data-favorite-search]");
const favoriteGrid = document.querySelector("[data-favorite-grid]");
const favoriteCount = document.querySelector("[data-favorite-count]");
const favoritesBack = document.querySelector("[data-favorites-back]");

const tabLabels = {
  countries: { label: "国家", placeholder: "搜索国家" },
  cities: { label: "城市", placeholder: "搜索城市或所属国家" },
  routes: { label: "路线", placeholder: "搜索路线名称、国家或城市" },
};

let activeFavoriteTab = "countries";

favoritesBack?.addEventListener("click", () => {
  window.location.href = "profile.html";
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readTravelState() {
  return window.TravelState?.readTravelState?.() || {};
}

function itemHref(item, type) {
  if (type === "cities") return `city-oslo.html#${encodeURIComponent(item.id)}`;
  if (type === "routes") return item.id === "nordic-aurora" ? "route-nordic.html" : `route-nordic.html#${encodeURIComponent(item.id)}`;
  return item.id === "JP" ? "country-japan.html" : `country-japan.html#${encodeURIComponent(item.id)}`;
}

function statusText(item) {
  if (item.explorationStatus === "explored") return "已探索";
  if (item.explorationStatus === "planned") return "待出行";
  return "未探索";
}

function routeMeta(item, state) {
  const countryNames = (item.countryIds || []).map((id) => state.countriesById?.[id]?.name || id);
  const cityNames = (item.cityIds || []).map((id) => state.citiesById?.[id]?.name || id);
  return countryNames.length ? countryNames.join(" · ") : cityNames.join(" · ");
}

function currentItems() {
  const state = readTravelState();
  const keyword = (favoriteSearch?.value || "").trim().toLowerCase();
  const items = window.TravelState?.getFavoriteItems?.(state, activeFavoriteTab) || [];
  return items.filter((item) => {
    const country = state.countriesById?.[item.countryId]?.name || "";
    const text = [
      item.name,
      item.id,
      item.searchText,
      item.kind,
      item.reason,
      item.days,
      item.season,
      item.budgetLevel,
      country,
      routeMeta(item, state),
    ].join(" ").toLowerCase();
    return !keyword || text.includes(keyword);
  });
}

function renderMetaIcon(type) {
  if (type === "season") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-7.2.4-11.4 4.6-12.6 12.6C14.4 15.4 18.6 11.2 19 4Z"></path><path d="M6.5 16.5 4 19"></path></svg>`;
  if (type === "budget") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2"></path><rect x="5" y="10" width="14" height="10" rx="2"></rect></svg>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v3M17 4v3M5.2 8.2h13.6"></path><rect x="4.2" y="5.8" width="15.6" height="14" rx="3"></rect></svg>`;
}

function renderFavoriteCard(item) {
  if (activeFavoriteTab === "cities") return renderFavoriteCityCard(item);
  if (activeFavoriteTab === "routes") return renderFavoriteRouteCard(item);
  return renderFavoriteCountryCard(item);
}

function renderFavoriteCountryCard(item) {
  const href = itemHref(item, "countries");
  return `
    <article class="favorite-card" tabindex="0" role="button" data-favorite-card data-favorite-id="${escapeHtml(item.id)}" data-favorite-href="${escapeHtml(href)}">
      <span class="favorite-cover">
        <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}封面图" />
        <span class="favorite-cover-shade"></span>
        <button class="favorite-heart" type="button" aria-label="取消收藏 ${escapeHtml(item.name)}" data-remove-favorite>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
        </button>
      </span>
      <span class="favorite-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <em>${escapeHtml(item.id)}</em>
        <small>${escapeHtml(statusText(item))}</small>
      </span>
    </article>
  `;
}

function renderFavoriteCityCard(item) {
  const state = readTravelState();
  const countryName = state.countriesById?.[item.countryId]?.name || item.countryId || "";
  return `
    <article class="favorite-city-card" tabindex="0" role="button" data-favorite-card data-favorite-id="${escapeHtml(item.id)}" data-favorite-href="${escapeHtml(itemHref(item, "cities"))}">
      <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}封面图" />
      <span class="favorite-city-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <em>${escapeHtml(countryName)}</em>
        <small>${escapeHtml(statusText(item))} · ${escapeHtml(countryName)}</small>
      </span>
      <button class="favorite-city-heart" type="button" aria-label="取消收藏 ${escapeHtml(item.name)}" data-remove-favorite>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
      </button>
    </article>
  `;
}

function renderFavoriteRouteCard(item) {
  const state = readTravelState();
  return `
    <article class="favorite-route-card" tabindex="0" role="button" data-favorite-card data-favorite-id="${escapeHtml(item.id)}" data-favorite-href="${escapeHtml(itemHref(item, "routes"))}">
      <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}封面图" />
      <span class="favorite-route-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <em>${escapeHtml(routeMeta(item, state))}</em>
        <span class="favorite-route-meta">
          <small>${renderMetaIcon("days")}${escapeHtml(item.days || "天数待定")}</small>
          <small>${renderMetaIcon("season")}${escapeHtml(item.season || "季节待定")}</small>
          <small>${renderMetaIcon("budget")}${escapeHtml(item.budgetLevel || "预算待定")}</small>
        </span>
      </span>
      <button class="favorite-route-heart" type="button" aria-label="取消收藏 ${escapeHtml(item.name)}" data-remove-favorite>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
      </button>
    </article>
  `;
}

function renderRouteTip() {
  return `
    <aside class="favorite-route-tip" aria-label="路线收藏提示">
      <img src="assets/favorite-route-pet.svg" alt="旅行收藏册小宠物" />
      <p>这些都是你收藏的路线<br />未来一定会去体验的！<span aria-hidden="true">🌿</span></p>
    </aside>
  `;
}

function renderFavorites() {
  const items = currentItems();
  if (favoriteCount) favoriteCount.textContent = `全部 ${items.length}`;
  if (!favoriteGrid) return;
  favoriteGrid.classList.toggle("city-list", activeFavoriteTab === "cities");
  favoriteGrid.classList.toggle("route-list", activeFavoriteTab === "routes");
  favoriteGrid.innerHTML = items.length
    ? `${items.map(renderFavoriteCard).join("")}${activeFavoriteTab === "routes" ? renderRouteTip() : ""}`
    : `<article class="trip-empty-state">没有匹配的收藏。</article>`;
}

favoriteTabs.forEach((button) => {
  button.addEventListener("click", () => {
    activeFavoriteTab = button.dataset.favoriteTab || "countries";
    favoriteTabs.forEach((item) => item.classList.toggle("active", item === button));
    if (favoriteSearch) {
      favoriteSearch.value = "";
      favoriteSearch.placeholder = tabLabels[activeFavoriteTab].placeholder;
    }
    renderFavorites();
  });
});

favoriteSearch?.addEventListener("input", renderFavorites);

favoriteGrid?.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-favorite]");
  if (remove) {
    event.preventDefault();
    event.stopPropagation();
    const card = remove.closest("[data-favorite-card]");
    const next = window.TravelState?.setFavorite?.(readTravelState(), activeFavoriteTab, card?.dataset.favoriteId, false);
    if (next) window.TravelState.writeTravelState(next);
    renderFavorites();
    return;
  }

  const card = event.target.closest("[data-favorite-card]");
  if (card?.dataset.favoriteHref) window.location.href = card.dataset.favoriteHref;
});

favoriteGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-favorite-card]");
  if (!card?.dataset.favoriteHref) return;
  event.preventDefault();
  window.location.href = card.dataset.favoriteHref;
});

renderFavorites();
