const searchInput = document.querySelector("[data-atlas-search]");
const countryCards = [...document.querySelectorAll("[data-country]")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const regionButtons = [...document.querySelectorAll("[data-region]")];

let activeFilter = "全部";

function updateCountryCards() {
  const keyword = (searchInput?.value || "").trim();

  countryCards.forEach((card) => {
    const name = card.dataset.country || "";
    const status = card.dataset.status || "";
    const matchesKeyword = !keyword || name.includes(keyword);
    const matchesFavorite = card.dataset.favorite === "true";
    const matchesFilter = activeFilter === "全部" || (activeFilter === "收藏" ? matchesFavorite : status === activeFilter);
    card.hidden = !matchesKeyword || !matchesFilter;
  });
}

searchInput?.addEventListener("input", updateCountryCards);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "全部";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateCountryCards();
  });
});

countryCards.forEach((card) => {
  card.addEventListener("click", () => {
    console.log(`open country detail: ${card.dataset.country}`);
  });
});

regionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log(`open region list: ${button.dataset.region}`);
  });
});
