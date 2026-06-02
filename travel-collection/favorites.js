const favoriteTabs = [...document.querySelectorAll("[data-favorite-tab]")];
const favoriteSearch = document.querySelector("[data-favorite-search]");
const favoriteGrid = document.querySelector("[data-favorite-grid]");
const favoriteCount = document.querySelector("[data-favorite-count]");

const favoriteData = {
  countries: [
    { name: "日本", en: "Japan", meta: "🇯🇵 已探索 · 3个城市", cover: "assets/favorite-japan-cover.svg", href: "country-japan.html" },
    { name: "土耳其", en: "Türkiye", meta: "🇹🇷 想去 · 2个城市", cover: "assets/favorite-turkey-cover.svg", href: "country-japan.html#country-TR" },
    { name: "冰岛", en: "Iceland", meta: "🇮🇸 想去 · 1个城市", cover: "assets/favorite-iceland-cover.svg", href: "country-japan.html#country-IS" },
    { name: "意大利", en: "Italy", meta: "🇮🇹 已探索 · 4个城市", cover: "assets/favorite-italy-cover.svg", href: "country-japan.html#country-IT" },
    { name: "希腊", en: "Greece", meta: "🇬🇷 想去 · 2个城市", cover: "assets/favorite-greece-cover.svg", href: "country-japan.html#country-GR" },
    { name: "泰国", en: "Thailand", meta: "🇹🇭 已探索 · 3个城市", cover: "assets/favorite-thailand-cover.svg", href: "country-japan.html#country-TH" },
  ],
  cities: [
    { name: "京都", en: "日本", meta: "已探索 · 日本", cover: "assets/detail-city-kyoto.svg", href: "city-oslo.html#kyoto" },
    { name: "巴塞罗那", en: "西班牙", meta: "想去 · 西班牙", cover: "assets/favorite-city-barcelona.svg", href: "city-oslo.html#barcelona" },
    { name: "清迈", en: "泰国", meta: "已探索 · 泰国", cover: "assets/favorite-city-chiangmai.svg", href: "city-oslo.html#chiangmai" },
    { name: "雷克雅未克", en: "冰岛", meta: "想去 · 冰岛", cover: "assets/favorite-city-reykjavik.svg", href: "city-oslo.html#reykjavik" },
    { name: "巴黎", en: "法国", meta: "已探索 · 法国", cover: "assets/favorite-city-paris.svg", href: "city-oslo.html#paris" },
    { name: "罗马", en: "意大利", meta: "已探索 · 意大利", cover: "assets/favorite-city-rome.svg", href: "city-oslo.html#rome" },
  ],
  routes: [
    { name: "北欧极光之旅", en: "挪威 · 瑞典 · 芬兰", days: "8-12天", season: "11月-3月", budget: "中高", cover: "assets/route-detail-hero-nordic.svg", href: "route-nordic.html" },
    { name: "土耳其经典之旅", en: "土耳其", days: "7-10天", season: "4月-10月", budget: "中等", cover: "assets/favorite-turkey-cover.svg", href: "route-nordic.html#turkey-classic" },
    { name: "日本关西之旅", en: "日本", days: "7-9天", season: "3月-5月", budget: "中等", cover: "assets/favorite-japan-cover.svg", href: "route-nordic.html#japan-kansai" },
    { name: "古希腊文明之旅", en: "希腊", days: "6-8天", season: "4月-10月", budget: "中等", cover: "assets/favorite-route-greece.svg", href: "route-nordic.html#greece-civilization" },
    { name: "东非 Safari 之旅", en: "肯尼亚 · 坦桑尼亚", days: "6-10天", season: "6月-10月", budget: "中高", cover: "assets/favorite-route-safari.svg", href: "route-nordic.html#east-africa-safari" },
    { name: "泰国海岛度假线", en: "泰国", days: "6-8天", season: "11月-2月", budget: "中等", cover: "assets/favorite-thailand-cover.svg", href: "route-nordic.html#thai-islands" },
    { name: "中亚大环线", en: "哈萨克斯坦 · 乌兹别克斯坦 · 吉尔吉斯斯坦", days: "10-14天", season: "4月-10月", budget: "中等", cover: "assets/favorite-route-central-asia.svg", href: "route-nordic.html#central-asia" },
    { name: "加拿大自然探索线", en: "加拿大", days: "8-12天", season: "6月-9月", budget: "中高", cover: "assets/favorite-route-canada.svg", href: "route-nordic.html#canada-nature" },
  ],
};

const tabLabels = {
  countries: { label: "国家", placeholder: "搜索国家", total: 12 },
  cities: { label: "城市", placeholder: "搜索城市或所属国家", total: 18 },
  routes: { label: "路线", placeholder: "搜索路线名称、国家或城市", total: 8 },
};

let activeFavoriteTab = "countries";

function currentItems() {
  const keyword = (favoriteSearch?.value || "").trim().toLowerCase();
  return (favoriteData[activeFavoriteTab] || []).filter((item) => {
    const text = `${item.name} ${item.en} ${item.meta || ""} ${item.days || ""} ${item.season || ""} ${item.budget || ""}`.toLowerCase();
    return !keyword || text.includes(keyword);
  });
}

function renderFavoriteCard(item) {
  if (activeFavoriteTab === "cities") return renderFavoriteCityCard(item);
  if (activeFavoriteTab === "routes") return renderFavoriteRouteCard(item);
  return `
    <article class="favorite-card" tabindex="0" role="button" data-favorite-card data-favorite-href="${item.href}" data-favorite-text="${item.name} ${item.en} ${item.meta}">
      <span class="favorite-cover">
        <img src="${item.cover}" alt="${item.name}封面图" />
        <span class="favorite-cover-shade"></span>
        <button class="favorite-heart" type="button" aria-label="取消收藏 ${item.name}" data-remove-favorite>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
        </button>
      </span>
      <span class="favorite-copy">
        <strong>${item.name}</strong>
        <em>${item.en}</em>
        <small>${item.meta}</small>
      </span>
    </article>
  `;
}

function renderMetaIcon(type) {
  if (type === "season") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-7.2.4-11.4 4.6-12.6 12.6C14.4 15.4 18.6 11.2 19 4Z"></path><path d="M6.5 16.5 4 19"></path></svg>`;
  if (type === "budget") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2"></path><rect x="5" y="10" width="14" height="10" rx="2"></rect></svg>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v3M17 4v3M5.2 8.2h13.6"></path><rect x="4.2" y="5.8" width="15.6" height="14" rx="3"></rect></svg>`;
}

function renderFavoriteRouteCard(item) {
  return `
    <article class="favorite-route-card" tabindex="0" role="button" data-favorite-card data-favorite-href="${item.href}" data-favorite-text="${item.name} ${item.en} ${item.days} ${item.season} ${item.budget}">
      <img src="${item.cover}" alt="${item.name}封面图" />
      <span class="favorite-route-copy">
        <strong>${item.name}</strong>
        <em>${item.en}</em>
        <span class="favorite-route-meta">
          <small>${renderMetaIcon("days")}${item.days}</small>
          <small>${renderMetaIcon("season")}${item.season}</small>
          <small>${renderMetaIcon("budget")}${item.budget}</small>
        </span>
      </span>
      <button class="favorite-route-heart" type="button" aria-label="取消收藏 ${item.name}" data-remove-favorite>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
      </button>
    </article>
  `;
}

function renderFavoriteCityCard(item) {
  return `
    <article class="favorite-city-card" tabindex="0" role="button" data-favorite-card data-favorite-href="${item.href}" data-favorite-text="${item.name} ${item.en} ${item.meta}">
      <img src="${item.cover}" alt="${item.name}封面图" />
      <span class="favorite-city-copy">
        <strong>${item.name}</strong>
        <em>${item.en}</em>
        <small>${item.meta}</small>
      </span>
      <button class="favorite-city-heart" type="button" aria-label="取消收藏 ${item.name}" data-remove-favorite>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2S5.2 15.1 5.2 9.9A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.8 2.1c0 5.2-6.8 9.3-6.8 9.3Z"></path></svg>
      </button>
    </article>
  `;
}

function renderFavorites() {
  const items = currentItems();
  const total = (favoriteSearch?.value || "").trim() ? items.length : tabLabels[activeFavoriteTab].total;
  if (favoriteCount) favoriteCount.textContent = `全部 ${total}`;
  if (!favoriteGrid) return;
  favoriteGrid.classList.toggle("city-list", activeFavoriteTab === "cities");
  favoriteGrid.classList.toggle("route-list", activeFavoriteTab === "routes");
  favoriteGrid.innerHTML = `${items.map(renderFavoriteCard).join("")}${activeFavoriteTab === "routes" ? renderRouteTip() : ""}`;
}

function renderRouteTip() {
  return `
    <aside class="favorite-route-tip" aria-label="路线收藏提示">
      <img src="assets/favorite-route-pet.svg" alt="旅行收藏册小宠物" />
      <p>这些都是你收藏的路线<br />未来一定会去体验的！<span aria-hidden="true">🌿</span></p>
    </aside>
  `;
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
    remove.closest("[data-favorite-card]")?.remove();
    if (favoriteCount) favoriteCount.textContent = `全部 ${favoriteGrid.querySelectorAll("[data-favorite-card]").length}`;
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
