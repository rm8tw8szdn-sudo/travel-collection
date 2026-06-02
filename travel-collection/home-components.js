const icons = {
  signal: `
    <svg class="status-signal" viewBox="0 0 18 12">
      <rect x="1" y="8" width="2" height="3" rx="0.7"></rect>
      <rect x="5" y="6" width="2" height="5" rx="0.7"></rect>
      <rect x="9" y="4" width="2" height="7" rx="0.7"></rect>
      <rect x="13" y="2" width="2" height="9" rx="0.7"></rect>
    </svg>
  `,
  wifi: `
    <svg class="status-wifi" viewBox="0 0 16 12">
      <path d="M2.1 4.2C5.4 1.5 10.6 1.5 13.9 4.2"></path>
      <path d="M4.6 6.7c1.9-1.5 4.9-1.5 6.8 0"></path>
      <path d="M7.1 9.2c.5-.4 1.3-.4 1.8 0"></path>
    </svg>
  `,
  battery: `
    <svg class="status-battery" viewBox="0 0 24 12">
      <rect x="1" y="2.2" width="19" height="7.6" rx="2"></rect>
      <rect x="3" y="4" width="15" height="4" rx="1"></rect>
      <rect x="21" y="4.4" width="2" height="3.2" rx="0.8"></rect>
    </svg>
  `,
  bell: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.2 9.4c0-3.1-2-5.4-5.2-5.4S6.8 6.3 6.8 9.4c0 5-2 5.5-2 6.8h14.4c0-1.3-2-1.8-2-6.8Z"></path>
      <path d="M9.8 18.2c.4 1 1.1 1.7 2.2 1.7s1.8-.7 2.2-1.7"></path>
    </svg>
  `,
  arrow: `
    <svg class="home-recent-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7"></path>
    </svg>
  `,
};

const tabs = [
  {
    label: "首页",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.8 12 4l8 6.8V20H5.5v-7.6H4Z"></path></svg>`,
  },
  {
    label: "图鉴",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8.4a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 0 1 6.2 0Z"></path><path d="M21.2 8.4a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 0 1 6.2 0Z"></path><path d="M15.1 17.3a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 0 1 6.2 0Z"></path><path d="m8.3 10.6 2.2 3.7M15.7 10.6l-2.2 3.7"></path></svg>`,
  },
  {
    label: "路线",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.2h13.6v9.6H5.2Z"></path><path d="M8.2 8.2V6.4h7.6v1.8M8.4 13h7.2"></path><path d="M17.2 5.1v2.4M16 6.3h2.4"></path></svg>`,
  },
  {
    label: "行程",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h12v15H6Z"></path><path d="M9 3v4M15 3v4M8.8 11h6.4M8.8 15h4.2"></path></svg>`,
  },
  {
    label: "我的",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12.1a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z"></path><path d="M5.5 20c.8-3.2 3-5 6.5-5s5.7 1.8 6.5 5"></path></svg>`,
  },
];

class StatusBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="home-statusbar" aria-label="状态栏">
        <time>${this.getAttribute("time") || "9:41"}</time>
        <div class="home-status-icons" aria-hidden="true">
          ${icons.signal}
          ${icons.wifi}
          ${icons.battery}
        </div>
      </header>
    `;
  }
}

class GreetingHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="home-greeting" aria-label="问候">
        <div>
          <h1>${this.getAttribute("title") || "你好，Ruby"} <span aria-hidden="true">${this.getAttribute("emoji") || "👋"}</span></h1>
          <p>${this.getAttribute("subtitle") || "每一次出发，都是世界给你的礼物。"}</p>
        </div>
        <button class="home-bell-button notification-bell" type="button" aria-label="通知" data-notification-bell>${icons.bell}<i data-notification-badge>3</i></button>
      </section>
    `;
  }
}

class StatCard extends HTMLElement {
  connectedCallback() {
    const state = readTravelState();
    const exploredCount = state.exploredCountryCount || (Array.isArray(state.exploredCountries) ? state.exploredCountries.length : null);
    this.innerHTML = `
      <section class="home-stat-card" aria-label="${this.getAttribute("label") || "已点亮国家"}">
        <div class="home-stat-copy">
          <p>${this.getAttribute("label") || "已点亮国家"}</p>
          <div class="home-stat-number"><strong>${this.getAttribute("count") || exploredCount || "11"}</strong><span>/ ${this.getAttribute("total") || "195"}</span></div>
          <p class="home-progress-label">${this.getAttribute("progress-label") || "世界探索进度"}</p>
          <div class="home-progress-row">
            <div class="home-progress-track"><i></i></div>
            <span>${this.getAttribute("percent") || "11%"}</span>
          </div>
        </div>
        <img class="home-map-asset" src="${this.getAttribute("map-src") || "assets/home-map-asset.svg"}" alt="" />
        <img class="home-mascot-asset" src="${this.getAttribute("mascot-src") || "assets/home-mascot-placeholder.svg"}" alt="旅行收集册宠物占位图" />
      </section>
    `;
  }
}

class TripPreviewCard extends HTMLElement {
  connectedCallback() {
    const state = readTravelState();
    const trip = state.nextTrip || {};
    const title = trip.name || this.getAttribute("title") || "北欧极光之旅";
    const places = Array.isArray(trip.places) ? trip.places.join("、") : this.getAttribute("places") || "挪威、冰岛、芬兰";
    const date = trip.start ? `出发日期：${trip.start}` : this.getAttribute("date") || "出发日期：2026.07.18";
    this.innerHTML = `
      <section class="home-next-card" aria-label="${this.getAttribute("label") || "下一目标"}">
        <div class="home-next-copy">
          <p>${this.getAttribute("label") || "下一目标"}</p>
          <h2>${title}</h2>
          <p>${places}</p>
          <p>${date}</p>
        </div>
        <img src="${this.getAttribute("cover-src") || "assets/home-aurora-cover.svg"}" alt="${this.getAttribute("cover-alt") || "极光封面图"}" />
      </section>
    `;
  }
}

class RecentTripCard extends HTMLElement {
  connectedCallback() {
    const chips = (this.getAttribute("chips") || "日本,3城市,1国家")
      .split(",")
      .map((chip) => `<span>${chip.trim()}</span>`)
      .join("");

    this.innerHTML = `
      <section class="home-recent-section" aria-label="最近旅程">
        <h2>${this.getAttribute("section-title") || "最近旅程"}</h2>
        <article class="home-recent-card">
          <img class="home-recent-cover" src="${this.getAttribute("cover-src") || "assets/home-japan-cover.svg"}" alt="${this.getAttribute("cover-alt") || "日本关西之旅封面图"}" />
          <div class="home-recent-copy">
            <h3>${this.getAttribute("title") || "日本关西之旅"}</h3>
            <p>${this.getAttribute("date") || "2026.04.10 - 04.17"}</p>
            <div class="home-recent-chips" aria-label="旅程标签">${chips}</div>
          </div>
          ${icons.arrow}
        </article>
      </section>
    `;
  }
}

class BottomTabBar extends HTMLElement {
  connectedCallback() {
    const activeLabel = this.getAttribute("active") || "首页";
    this.innerHTML = `
      <nav class="home-tabbar" aria-label="底部导航">
        ${tabs
          .map((tab) => {
            const isActive = tab.label === activeLabel;
            return `
              <a class="${isActive ? "active" : ""}" href="#" ${isActive ? 'aria-current="page"' : ""}>
                <span>${tab.icon}</span>
                ${tab.label}
              </a>
            `;
          })
          .join("")}
      </nav>
    `;
  }
}

customElements.define("status-bar", StatusBar);
customElements.define("greeting-header", GreetingHeader);
customElements.define("stat-card", StatCard);
customElements.define("trip-preview-card", TripPreviewCard);
customElements.define("recent-trip-card", RecentTripCard);
customElements.define("bottom-tab-bar", BottomTabBar);

function readTravelState() {
  try {
    return JSON.parse(localStorage.getItem("travelCollectionState") || "{}");
  } catch {
    return {};
  }
}
