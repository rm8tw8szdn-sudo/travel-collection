const routeSearch = document.querySelector("[data-route-search]");
const routeCards = [...document.querySelectorAll("[data-route-name]")];
const routeTabButtons = [...document.querySelectorAll("[data-route-tab]")];
const routeFilterButtons = [...document.querySelectorAll("[data-route-filter]")];

let activeRouteTab = "跨国路线";
let activeRouteFilter = "全部";

function updateRoutes() {
  const keyword = (routeSearch?.value || "").trim();

  routeCards.forEach((card) => {
    const name = card.dataset.routeName || "";
    const kind = card.dataset.routeKind || "";
    const tags = card.dataset.routeTags || "";
    const matchesKeyword = !keyword || name.includes(keyword);
    const matchesTab = activeRouteTab === "跨国路线" || kind === activeRouteTab;
    const matchesFilter = activeRouteFilter === "全部" || tags.includes(activeRouteFilter);
    card.hidden = !matchesKeyword || !matchesTab || !matchesFilter;
  });
}

routeSearch?.addEventListener("input", updateRoutes);

routeTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeRouteTab = button.dataset.routeTab || "跨国路线";
    routeTabButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateRoutes();
  });
});

routeFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeRouteFilter = button.dataset.routeFilter || "全部";
    routeFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateRoutes();
  });
});

routeCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (card.dataset.routeDetail) {
      window.location.href = card.dataset.routeDetail;
      return;
    }
    window.location.hash = `route-${card.dataset.routeName || "detail"}`;
  });
});

updateRoutes();
