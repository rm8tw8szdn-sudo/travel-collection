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
    cover: "assets/detail-city-tokyo.svg",
    description: "现代与传统交织的国际化大都市。",
    meta: "来自 我的旅行足迹 · Ruby",
  },
  route: {
    type: "路线",
    name: "北欧极光线",
    cover: "assets/route-nordic-cover.svg",
    description: "挪威 · 冰岛 · 芬兰",
    meta: "8天 · 3国",
  },
  trip: {
    type: "行程",
    name: "北欧极光之旅",
    cover: "assets/trip-nordic-cover.svg",
    description: "挪威 · 冰岛 · 芬兰",
    meta: "2026.07.18 - 07.30 · 12天 · 3国",
  },
};

const NOTIFICATIONS = [
  { type: "行程提醒", text: "北欧极光之旅还有 45 天出发。", time: "今天 09:20", unread: true },
  { type: "成就解锁", text: "你已解锁 10 个国家徽章。", time: "昨天 18:10", unread: true },
  { type: "足迹更新", text: "日本记录已同步到我的足迹。", time: "周一 12:30", unread: true },
  { type: "系统消息", text: "旅行收藏册视觉原型已更新。", time: "5月20日", unread: false },
];

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
  ensureModal(
    "notificationList",
    `
      <div class="flow-overlay shared-overlay">
        <section class="notification-list-modal" role="dialog" aria-modal="true" data-notification-list>
          <button class="shared-close" type="button" aria-label="关闭" data-close-modal>×</button>
          <h2>通知</h2>
          <div>
            ${NOTIFICATIONS.map((item) => `
              <article class="${item.unread ? "unread" : ""}">
                <strong>${item.type}</strong>
                <p>${item.text}</p>
                <small>${item.time}${item.unread ? " · 未读" : " · 已读"}</small>
              </article>
            `).join("")}
          </div>
        </section>
      </div>
    `,
  );
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
    event.preventDefault();
    openShareCard("country");
  });
});

document.querySelector("[data-notification-bell]")?.addEventListener("click", openNotifications);
document.querySelector("[data-favorites-entry]")?.addEventListener("click", openFavorites);

window.openShareCard = openShareCard;
