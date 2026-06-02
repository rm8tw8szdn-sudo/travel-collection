document.querySelector("[data-route-back]")?.addEventListener("click", () => {
  window.location.href = "routes.html";
});

document.querySelector("[data-route-favorite]")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isFavorited = button.classList.toggle("favorited");
  button.setAttribute("aria-pressed", String(isFavorited));
});

document.querySelector("[data-route-share]")?.addEventListener("click", () => {
  window.openShareCard?.("route", {
    name: "北欧极光之旅",
    cover: "assets/route-detail-hero-nordic.svg",
    description: "挪威 · 瑞典 · 芬兰",
    meta: "8-12天 · 3国",
  });
});
