const defaultFootprint = {
  countries: ["JP", "TR", "TH", "IT", "FR", "IS", "KR", "SG", "MY", "AE", "EG"],
  cities: [
    "东京",
    "京都",
    "大阪",
    "札幌",
    "伊斯坦布尔",
    "卡帕多奇亚",
    "安塔利亚",
    "清迈",
    "清莱",
    "罗马",
    "佛罗伦萨",
    "威尼斯",
    "巴黎",
    "尼斯",
    "雷克雅未克",
    "首尔",
    "釜山",
    "新加坡",
    "吉隆坡",
    "槟城",
    "迪拜",
    "阿布扎比",
    "开罗",
    "卢克索",
    "横滨",
    "奈良",
    "神户",
  ],
  completedTrips: 8,
};

function readTravelState() {
  try {
    return JSON.parse(localStorage.getItem("travelCollectionState") || "{}");
  } catch {
    return {};
  }
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function calculateFootprintStats(state = readTravelState()) {
  const trips = normalizeList(state.trips);
  const completedTrips = trips.filter((trip) => trip.status === "completed");

  if (!trips.length) {
    return {
      countries: defaultFootprint.countries.length,
      cities: defaultFootprint.cities.length,
      completedTrips: defaultFootprint.completedTrips,
    };
  }

  const manualExploredCountries = normalizeList(state.manualExploredCountries || state.exploredCountries);
  const manualExploredCities = normalizeList(state.manualExploredCities || state.exploredCities);
  const countries = new Set(manualExploredCountries);
  const cities = new Set(manualExploredCities);

  completedTrips.forEach((trip) => {
    normalizeList(trip.countries).forEach((country) => countries.add(country));
    normalizeList(trip.cities).forEach((city) => cities.add(city));
  });

  return {
    countries: countries.size,
    cities: cities.size,
    completedTrips: completedTrips.length,
  };
}

function hydrateFootprintStats() {
  const stats = calculateFootprintStats();
  const progress = Math.min(100, Math.max(0, stats.countries / 195 * 100));
  const percent = `${progress.toFixed(1)}%`;

  document.querySelectorAll("[data-footprint-country-count]").forEach((node) => {
    node.textContent = String(stats.countries);
  });
  document.querySelectorAll("[data-footprint-city-count]").forEach((node) => {
    node.textContent = String(stats.cities);
  });
  document.querySelectorAll("[data-footprint-trip-count]").forEach((node) => {
    node.textContent = String(stats.completedTrips);
  });
  document.querySelector("[data-footprint-progress]")?.style.setProperty("--footprint-progress", percent);
  document.querySelector("[data-footprint-progress-percent]")?.replaceChildren(percent);
}

function openFootprintNotice(title, text) {
  const rootName = "footprintNotice";
  let modal = document.querySelector(`[data-shared-root="${rootName}"]`);
  if (!modal) {
    modal = document.createElement("div");
    modal.setAttribute("data-shared-root", rootName);
    document.querySelector(".home-screen")?.append(modal);
  }
  modal.innerHTML = `
    <div class="flow-overlay shared-overlay">
      <section class="notification-list-modal footprint-notice" role="dialog" aria-modal="true">
        <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
        <h2>${title}</h2>
        <article><strong>${text}</strong><p>这里会在正式版本中展开对应列表。</p><small>占位入口</small></article>
      </section>
    </div>
  `;
  modal.hidden = false;
  modal.querySelector("[data-close-modal]")?.addEventListener("click", () => {
    modal.hidden = true;
  });
}

document.querySelector("[data-footprint-calendar]")?.addEventListener("click", () => {
  openFootprintNotice("时间筛选", "按年份、月份筛选足迹记录。");
});

document.querySelector("[data-footprint-share]")?.addEventListener("click", () => {
  const stats = calculateFootprintStats();
  window.openShareCard?.("trip", {
    name: "Ruby 的旅行足迹",
    cover: "assets/footprint-world-map.svg",
    description: `已探索 ${stats.countries} 个国家 · ${stats.cities} 个城市`,
    meta: `完成旅程 ${stats.completedTrips} 趟`,
  });
});

document.querySelectorAll("[data-footprint-list]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.footprintList === "achievements" ? "完整成就列表" : "完整旅程列表";
    openFootprintNotice(type, `打开${type}。`);
  });
});

document.querySelectorAll("[data-trip-detail]").forEach((trip) => {
  trip.addEventListener("click", () => {
    window.location.href = `trips.html#${trip.dataset.tripDetail || "trip"}`;
  });
});

document.querySelectorAll("[data-achievement]").forEach((card) => {
  card.addEventListener("click", () => {
    openFootprintNotice("成就详情", card.querySelector("strong")?.textContent || "成就详情");
  });
});

hydrateFootprintStats();
