import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const travelData = require("../travel-data.js");
const travelSearch = require("../travel-search.js");

const state = {
  countries: travelData.DEFAULT_COUNTRIES,
  cities: travelData.DEFAULT_CITIES,
  routes: travelData.DEFAULT_ROUTES,
  countriesById: Object.fromEntries(travelData.DEFAULT_COUNTRIES.map((item) => [item.id, item])),
  citiesById: Object.fromEntries(travelData.DEFAULT_CITIES.map((item) => [item.id, item])),
  routesById: Object.fromEntries(travelData.DEFAULT_ROUTES.map((item) => [item.id, item])),
};

assert(state.countriesById.JP, "Japan should exist in migrated data");
assert(state.countriesById.FR, "France should be migrated from legacy country guides");
assert(state.citiesById["JP-TYO"], "Tokyo should exist as a city entity");
assert(state.routesById["east-africa-safari"], "East Africa Safari route should exist");
assert(state.routesById["egypt-pyramids"], "Egypt pyramid route should exist");

const japanResults = travelSearch.searchAtlas(state, "日本");
assert(japanResults.some((item) => item.type === "country" && item.id === "JP"), "Japan search should include Japan");
assert(japanResults.some((item) => item.type === "city" && item.id === "JP-TYO"), "Japan search should include Tokyo");
assert(japanResults.some((item) => item.type === "city" && item.id === "JP-KYO"), "Japan search should include Kyoto");
assert(japanResults.some((item) => item.type === "city" && item.id === "JP-OSA"), "Japan search should include Osaka");

const tokyoResults = travelSearch.searchAtlas(state, "东京");
assert(tokyoResults.some((item) => item.type === "city" && item.id === "JP-TYO"), "Tokyo search should include Tokyo");
assert(tokyoResults.some((item) => item.type === "country" && item.id === "JP"), "Tokyo search should include parent Japan");

const pyramidRoutes = travelSearch.searchRoutes(state, "金字塔");
assert(pyramidRoutes.some((route) => route.id === "egypt-pyramids"), "Pyramid search should find Egypt route");

const safariRoutes = travelSearch.searchRoutes(state, "Safari");
assert(safariRoutes.some((route) => route.id === "east-africa-safari"), "Safari search should find East Africa route");

assert(travelData.DEFAULT_COUNTRIES.length >= 30, "Migrated data should include broad legacy country coverage");
assert(travelData.DEFAULT_ROUTES.length >= 20, "Migrated data should include broad legacy route coverage");

for (const country of travelData.DEFAULT_COUNTRIES) {
  for (const key of ["id", "name", "englishName", "continent", "cover", "intro", "recommendedDays", "bestSeason", "budgetLevel"]) {
    assert(country[key], `Country ${country.id} should include ${key}`);
  }
  assert(Array.isArray(country.tags) && country.tags.length, `Country ${country.id} should include tags`);
  assert(Array.isArray(country.keywords) && country.keywords.length, `Country ${country.id} should include keywords`);
  assert(Array.isArray(country.cityIds) && country.cityIds.length, `Country ${country.id} should link recommended cities`);
  assert(Array.isArray(country.routeIds) && country.routeIds.length, `Country ${country.id} should link related routes`);
}

for (const city of travelData.DEFAULT_CITIES) {
  for (const key of ["id", "countryId", "name", "englishName", "cover", "intro"]) {
    assert(city[key], `City ${city.id} should include ${key}`);
  }
  assert(state.countriesById[city.countryId], `City ${city.id} should reference an existing country`);
  assert(Array.isArray(city.tags) && city.tags.length, `City ${city.id} should include tags`);
  assert(Array.isArray(city.spots) && city.spots.length >= 3 && city.spots.length <= 5, `City ${city.id} should include 3-5 spots`);
  assert(Array.isArray(city.keywords) && city.keywords.length, `City ${city.id} should include keywords`);
}

for (const route of travelData.DEFAULT_ROUTES) {
  for (const key of ["id", "name", "kind", "cover", "reason", "days", "season", "budgetLevel"]) {
    assert(route[key], `Route ${route.id} should include ${key}`);
  }
  assert(Array.isArray(route.countryIds) && route.countryIds.length, `Route ${route.id} should link countries`);
  assert(Array.isArray(route.cityIds) && route.cityIds.length, `Route ${route.id} should link cities`);
  assert(Array.isArray(route.tags) && route.tags.length, `Route ${route.id} should include tags`);
  assert(Array.isArray(route.keywords) && route.keywords.length, `Route ${route.id} should include keywords`);
  route.countryIds.forEach((id) => assert(state.countriesById[id], `Route ${route.id} should reference existing country ${id}`));
  route.cityIds.forEach((id) => assert(state.citiesById[id], `Route ${route.id} should reference existing city ${id}`));
}

console.log("Data and search integration verified.");
