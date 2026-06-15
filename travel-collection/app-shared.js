const SHARE_PRESETS = {
  country: {
    type: "国家",
    name: "日本",
    cover: "assets/detail-japan-hero.svg",
    description: "融合传统与现代的国度，四季分明，值得一去再去。",
    meta: "来自 我的旅行足迹 · Ruby",
  },
  city: {
    type: "城市",
    name: "东京",
    cover: "assets/city-tokyo-cover.svg",
    description: "现代与传统交织的国际化大都市。",
    meta: "来自 我的旅行足迹 · Ruby",
  },
  route: {
    type: "路线",
    name: "北欧极光线",
    cover: "assets/route-nordic-aurora-cover.svg",
    description: "挪威 · 冰岛 · 芬兰",
    meta: "8天 · 3国",
  },
  trip: {
    type: "行程",
    name: "北欧极光之旅",
    cover: "assets/route-nordic-aurora-cover.svg",
    description: "挪威 · 冰岛 · 芬兰",
    meta: "2026.07.18 - 07.30 · 12天 · 3国",
  },
};

function ensureModal(name, html) {
  const kebabName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  let modal = document.querySelector(`[data-shared-root="${kebabName}"]`);
  if (!modal) {
    modal = document.createElement("div");
    modal.setAttribute("data-shared-root", kebabName);
    document.querySelector(".home-screen")?.append(modal);
  }
  modal.innerHTML = html;
  modal.hidden = false;
  modal.querySelector("[data-close-modal]")?.addEventListener("click", () => {
    modal.hidden = true;
  });
  return modal;
}

function openShareCard(kind, overrides = {}) {
  const data = { ...(SHARE_PRESETS[kind] || SHARE_PRESETS.country), ...overrides };
  ensureModal(
    "shareCardModal",
    `
      <div class="flow-overlay shared-overlay">
        <section class="share-card-modal" role="dialog" aria-modal="true" data-share-card-modal>
          <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
          <article class="share-card-preview" style="--share-cover: url('${data.cover}')">
            <img src="${data.cover}" alt="${data.name}封面图" />
            <span class="share-card-shade"></span>
            <div class="share-card-copy">
              <em>${data.type}</em>
              <strong>${data.name}</strong>
              <p>${data.description}</p>
              <small>${data.meta}</small>
            </div>
            <div class="share-qr" aria-label="二维码占位" data-qr-placeholder><i></i><i></i><i></i><i></i></div>
          </article>
        </section>
      </div>
    `,
  );
}

function openNotifications() {
  const state = window.TravelState?.readTravelState?.() || {};
  const notifications = window.TravelState?.getNotifications?.(state) || [];
  const modal = ensureModal(
    "notificationList",
    `
      <div class="flow-overlay shared-overlay">
        <section class="notification-list-modal" role="dialog" aria-modal="true" data-notification-list>
          <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
          <h2>通知</h2>
          <div>
            ${notifications.map((item) => `
              <article class="${item.read ? "" : "unread"}">
                <strong>${item.type}</strong>
                <p>${item.text}</p>
                <small>${item.time}${item.read ? " · 已读" : " · 未读"}</small>
                ${item.read ? "" : `<button type="button" data-mark-notification-read="${item.id}">标为已读</button>`}
              </article>
            `).join("")}
          </div>
        </section>
      </div>
    `,
  );
  modal.querySelectorAll("[data-mark-notification-read]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = window.TravelState?.markNotificationRead?.(window.TravelState.readTravelState(), button.dataset.markNotificationRead);
      if (next) window.TravelState.writeTravelState(next);
      openNotifications();
    });
  });
}

function openFavorites() {
  ensureModal(
    "favoritesModal",
    `
      <div class="flow-overlay shared-overlay">
        <section class="favorites-modal" role="dialog" aria-modal="true" data-favorites-modal>
          <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
          <h2>我的收藏</h2>
          <div class="favorite-group"><strong>国家</strong><span>日本</span><span>冰岛</span></div>
          <div class="favorite-group"><strong>城市</strong><span>东京</span><span>京都</span></div>
          <div class="favorite-group"><strong>路线</strong><span>北欧极光线</span><span>冰岛环岛线</span></div>
        </section>
      </div>
    `,
  );
}

function openAddToTripModal(payload = {}) {
  const state = window.TravelState?.readTravelState?.() || {};
  const trips = (state.trips || []).filter((trip) => trip.status !== "completed");
  const itemName = payload.name || "目的地";
  const options = trips.map((trip) => `
    <button type="button" data-confirm-add-trip="${trip.id}">
      <strong>${trip.name}</strong>
      <small>${trip.start || trip.startDate || "日期待定"}</small>
    </button>
  `).join("");

  const modal = ensureModal(
    "addTripModal",
    `
      <div class="flow-overlay shared-overlay">
        <section class="notification-list-modal add-trip-modal" role="dialog" aria-modal="true" data-add-trip-modal>
          <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
          <h2>加入行程</h2>
          <article>
            <strong>${itemName}</strong>
            <p>选择一个待出行行程，或创建新的轻量行程。</p>
            <div class="add-trip-options">
              ${options || `<small>暂无待出行行程</small>`}
              <button type="button" data-create-trip-from-payload>创建新行程</button>
            </div>
          </article>
        </section>
      </div>
    `,
  );

  modal.querySelectorAll("[data-confirm-add-trip]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetTripId = button.dataset.confirmAddTrip;
      window.TravelState?.updateTravelState?.((nextState) => {
        const nextTrip = (nextState.trips || []).find((trip) => trip.id === targetTripId);
        if (!nextTrip) return nextState;
        nextTrip.countryIds = [...new Set([...(nextTrip.countryIds || []), ...(payload.countryIds || [])])];
        nextTrip.cityIds = [...new Set([...(nextTrip.cityIds || []), ...(payload.cityIds || [])])];
        if (payload.type === "route") nextTrip.sourceRouteId = payload.id;
        return nextState;
      });
      modal.hidden = true;
    });
  });

  modal.querySelector("[data-create-trip-from-payload]")?.addEventListener("click", () => {
    window.TravelState?.updateTravelState?.((nextState) => {
      const countries = payload.countryIds || [];
      const countryNames = countries.map((id) => nextState.countriesById?.[id]?.name || id).filter(Boolean);
      const name = countryNames.length === 1
        ? `${countryNames[0]}之旅`
        : countryNames.length > 1
          ? `${countryNames.slice(0, 2).join(" · ")}之旅`
          : `${itemName}之旅`;
      const trip = {
        id: `trip-${Date.now()}`,
        name,
        status: "planned",
        start: "2026.08.01",
        end: "2026.08.07",
        sourceRouteId: payload.type === "route" ? payload.id : null,
        countryIds: [...new Set(payload.countryIds || [])],
        cityIds: [...new Set(payload.cityIds || [])],
        budget: "",
        currency: "CNY",
        note: "",
        planStatus: "规划中",
      };
      nextState.trips = [...(nextState.trips || []), trip];
      return nextState;
    });
    modal.hidden = true;
  });
}

document.querySelectorAll("[data-share-card-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    const kind = trigger.dataset.shareType || "country";
    openShareCard(kind, {
      name: trigger.dataset.shareName,
      cover: trigger.dataset.shareCover,
      description: trigger.dataset.shareDescription,
      meta: trigger.dataset.shareMeta,
    });
  });
});

document.querySelectorAll("[data-share]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (!document.querySelector(".country-screen")) return;
    if (event.defaultPrevented) return;
    event.preventDefault();
    openShareCard("country");
  });
});

document.querySelector("[data-notification-bell]")?.addEventListener("click", openNotifications);
document.querySelector("[data-favorites-entry]")?.addEventListener("click", openFavorites);

window.openShareCard = openShareCard;
window.openAddToTripModal = openAddToTripModal;
window.openNotifications = openNotifications;
