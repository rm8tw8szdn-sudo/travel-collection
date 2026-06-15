import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  TRAVEL_STATE_STORAGE_KEY,
  createDefaultTravelState,
  recalculateTravelState,
  getTravelStats,
  resolveTripCover,
  getTripBudgetItems,
  setTripStatus,
  removeTrip,
  setFavorite,
  getFavoriteItems,
  getAchievements,
  getNotifications,
  markNotificationRead,
} = require("../travel-state.js");

assert.equal(TRAVEL_STATE_STORAGE_KEY, "travelCollectionState");

function ids(items) {
  return items.map((item) => item.id).sort();
}

function baseState(overrides = {}) {
  return {
    userProfile: { nickname: "Ruby" },
    countries: [
      { id: "JP", name: "日本", cover: "assets/atlas-japan-cover.svg" },
      { id: "NO", name: "挪威", cover: "assets/route-country-norway.svg" },
      { id: "IS", name: "冰岛", cover: "assets/atlas-iceland-cover.svg" },
    ],
    cities: [
      { id: "JP-TYO", name: "东京", countryId: "JP", cover: "assets/detail-city-tokyo.svg" },
      { id: "NO-OSL", name: "奥斯陆", countryId: "NO", cover: "assets/route-city-oslo.svg" },
      { id: "IS-REK", name: "雷克雅未克", countryId: "IS", cover: "assets/favorite-city-reykjavik.svg" },
    ],
    routes: [
      {
        id: "nordic-aurora",
        name: "北欧极光线",
        cover: "assets/route-nordic-cover.svg",
        countryIds: ["NO", "IS"],
        cityIds: ["NO-OSL", "IS-REK"],
      },
    ],
    trips: [],
    manualExploredCountryIds: [],
    manualExploredCityIds: [],
    favoriteCountryIds: [],
    favoriteCityIds: [],
    favoriteRouteIds: [],
    achievements: [],
    notifications: [],
    ...overrides,
  };
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-japan", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"] },
      { id: "trip-nordic", status: "upcoming", countryIds: ["NO"], cityIds: ["NO-OSL"] },
    ],
    favoriteCountryIds: ["NO"],
  }));

  assert.equal(state.countriesById.JP.explorationStatus, "explored");
  assert.equal(state.countriesById.NO.explorationStatus, "planned");
  assert.equal(state.countriesById.IS.explorationStatus, "unexplored");
  assert.equal(state.countriesById.NO.isFavorite, true);
  assert.equal(state.countriesById.JP.isFavorite, false);
  assert.equal(state.citiesById["JP-TYO"].explorationStatus, "explored");
  assert.equal(state.citiesById["NO-OSL"].explorationStatus, "planned");
  assert.deepEqual(ids(state.exploredCountries), ["JP"]);
  assert.deepEqual(ids(state.plannedCountries), ["NO"]);
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-done", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"] },
      { id: "trip-plan", status: "planned", countryIds: ["JP", "NO"], cityIds: ["JP-TYO", "NO-OSL"] },
    ],
  }));

  assert.equal(state.countriesById.JP.explorationStatus, "explored");
  assert.equal(state.citiesById["JP-TYO"].explorationStatus, "explored");
  assert.equal(state.countriesById.NO.explorationStatus, "planned");
}

{
  const state = recalculateTravelState(baseState({
    routes: [
      { id: "jp-route", countryIds: ["JP"], cityIds: ["JP-TYO"], cover: "assets/route-kansai-cover.svg" },
    ],
    favoriteRouteIds: ["jp-route"],
  }));

  assert.equal(state.countriesById.JP.explorationStatus, "unexplored");
  assert.equal(state.citiesById["JP-TYO"].explorationStatus, "unexplored");
  assert.equal(state.routesById["jp-route"].isFavorite, true);
}

{
  const withCompleted = recalculateTravelState(baseState({
    trips: [
      { id: "trip-a", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"] },
      { id: "trip-b", status: "completed", countryIds: ["JP"], cityIds: [] },
    ],
  }));
  assert.equal(withCompleted.countriesById.JP.explorationStatus, "explored");

  const afterDeleteOne = recalculateTravelState({
    ...withCompleted,
    trips: withCompleted.trips.filter((trip) => trip.id !== "trip-a"),
  });
  assert.equal(afterDeleteOne.countriesById.JP.explorationStatus, "explored");

  const afterDeleteBoth = recalculateTravelState({
    ...withCompleted,
    trips: [],
  });
  assert.equal(afterDeleteBoth.countriesById.JP.explorationStatus, "unexplored");
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-japan", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"] },
    ],
  }));
  const changedBack = recalculateTravelState({
    ...state,
    trips: state.trips.map((trip) => ({ ...trip, status: "upcoming" })),
  });

  assert.equal(changedBack.countriesById.JP.explorationStatus, "planned");
  assert.equal(changedBack.citiesById["JP-TYO"].explorationStatus, "planned");
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-route", routeId: "nordic-aurora", countryIds: ["NO"], cityIds: ["NO-OSL"] },
      { id: "trip-country", countryIds: ["JP"], cityIds: [] },
      { id: "trip-default", countryIds: [], cityIds: [] },
    ],
  }));

  const defaultRouteCover = createDefaultTravelState().routes.find((route) => route.id === "nordic-aurora")?.cover;
  assert.equal(resolveTripCover(state.trips[0], state), defaultRouteCover);
  assert.equal(resolveTripCover(state.trips[1], state), state.countriesById.JP.cover);
  assert.equal(resolveTripCover(state.trips[2], state), "assets/home-aurora-cover.svg");
}

{
  const state = recalculateTravelState(baseState({
    manualExploredCountryIds: ["IS"],
    manualExploredCityIds: ["IS-REK"],
    favoriteCountryIds: ["JP", "NO"],
    favoriteCityIds: ["JP-TYO"],
    favoriteRouteIds: ["nordic-aurora"],
    trips: [
      { id: "trip-done", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"] },
      { id: "trip-plan", status: "upcoming", countryIds: ["NO"], cityIds: ["NO-OSL"] },
    ],
  }));
  const stats = getTravelStats(state);

  assert.equal(stats.exploredCountryCount, 2);
  assert.equal(stats.exploredCityCount, 2);
  assert.equal(stats.plannedCountryCount, 1);
  assert.equal(stats.favoriteCount, 4);
  assert.equal(stats.completedTripCount, 1);
}

{
  const state = createDefaultTravelState();
  const normalized = recalculateTravelState(state);

  assert.ok(normalized.countries.length >= 3);
  assert.ok(normalized.cities.length >= 3);
  assert.ok(Array.isArray(normalized.trips));
  assert.equal(getTravelStats(normalized).totalCountryCount, 195);
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-a", status: "completed", countryIds: ["JP"], cityIds: ["JP-TYO"], budget: 12000 },
      { id: "trip-b", status: "completed", countryIds: ["NO"], cityIds: ["NO-OSL"], budget: 8000 },
    ],
    budgetItems: {
      "trip-a": [
        { id: "a-flight", name: "机票", category: "交通", amount: 5200 },
        { id: "a-hotel", name: "酒店", category: "住宿", amount: 4100 },
      ],
      "trip-b": [
        { id: "b-flight", name: "机票", category: "交通", amount: 3900 },
      ],
    },
  }));

  assert.equal(getTripBudgetItems(state, "trip-a").length, 2);
  assert.equal(getTripBudgetItems(state, "trip-b").length, 1);
  assert.equal(getTripBudgetItems(state, "missing").length, 0);
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-japan", status: "upcoming", countryIds: ["JP"], cityIds: ["JP-TYO"] },
    ],
  }));

  const completed = setTripStatus(state, "trip-japan", "completed", { memory: "樱花很好。" });
  assert.equal(completed.trips[0].status, "completed");
  assert.equal(completed.trips[0].memory, "樱花很好。");
  assert.equal(completed.countriesById.JP.explorationStatus, "explored");

  const upcoming = setTripStatus(completed, "trip-japan", "upcoming");
  assert.equal(upcoming.trips[0].status, "planned");
  assert.equal(upcoming.countriesById.JP.explorationStatus, "planned");

  const removed = removeTrip(upcoming, "trip-japan");
  assert.equal(removed.trips.length, 0);
  assert.equal(removed.countriesById.JP.explorationStatus, "unexplored");
}

{
  const state = recalculateTravelState(baseState({
    favoriteCountryIds: ["JP"],
    favoriteCityIds: ["JP-TYO"],
    favoriteRouteIds: ["nordic-aurora"],
  }));
  assert.equal(getFavoriteItems(state, "countries").length, 1);
  assert.equal(getFavoriteItems(state, "cities").length, 1);
  assert.equal(getFavoriteItems(state, "routes").length, 1);

  const unfavorited = setFavorite(state, "countries", "JP", false);
  assert.equal(unfavorited.countriesById.JP.isFavorite, false);
  assert.equal(unfavorited.countriesById.JP.explorationStatus, "unexplored");
  assert.equal(getTravelStats(unfavorited).favoriteCount, 2);
}

{
  const state = recalculateTravelState(baseState({
    trips: [
      { id: "trip-japan", status: "upcoming", name: "日本测试行程", countryIds: ["JP"], cityIds: ["JP-TYO"] },
    ],
    favoriteCountryIds: ["NO"],
  }));
  const completed = setTripStatus(state, "trip-japan", "completed", { memory: "任务五完成记录" });
  const achievements = getAchievements(completed);
  const notifications = getNotifications(completed);

  assert.ok(achievements.some((item) => item.id === "first_country" && item.unlockedAt), "completion should unlock first_country achievement");
  assert.ok(achievements.some((item) => item.id === "first_trip" && item.unlockedAt), "completion should unlock first_trip achievement");
  assert.ok(notifications.some((item) => item.type === "足迹事件" && item.text.includes("日本测试行程")), "completion should create footprint notification");
  assert.ok(notifications.some((item) => item.type === "成就解锁"), "completion should create achievement notification");

  const removed = removeTrip(completed, "trip-japan");
  assert.ok(getAchievements(removed).some((item) => item.id === "first_trip" && item.unlockedAt), "unlocked achievement should remain after deleting trip");

  const unread = getNotifications(completed).find((item) => !item.read);
  assert.ok(unread);
  const readState = markNotificationRead(completed, unread.id);
  assert.equal(getNotifications(readState).find((item) => item.id === unread.id)?.read, true);
}

console.log("Travel state calculations verified.");
