import fs from "node:fs";

const html = fs.readFileSync(new URL("../footprint.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../mobile.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../footprint.js", import.meta.url), "utf8");

const requiredHtml = [
  'class="home-screen footprint-screen"',
  'bottom-tab-bar active="我的"',
  'data-footprint-calendar',
  'data-footprint-share',
  'data-footprint-map-asset',
  'data-footprint-pet-asset',
  'data-footprint-progress',
  'data-footprint-country-count',
  'data-footprint-city-count',
  'data-footprint-trip-count',
  'data-footprint-list="trips"',
  'data-footprint-list="achievements"',
  'data-trip-detail="trip-japan"',
  'data-achievement="asia-first"',
];

const requiredCss = [
  ".footprint-map-card",
  ".footprint-progress-card",
  ".footprint-timeline-line",
  ".footprint-stats-card",
  ".footprint-achievement-grid",
  ".footprint-screen .home-tabbar",
  "overflow-y: auto",
];

const requiredJs = [
  "function calculateFootprintStats",
  "completedTrips",
  "manualExploredCountries",
  "manualExploredCities",
  "data-footprint-country-count",
  "data-footprint-city-count",
  "data-footprint-trip-count",
];

const missing = [
  ...requiredHtml.filter((marker) => !html.includes(marker)),
  ...requiredCss.filter((marker) => !css.includes(marker)),
  ...requiredJs.filter((marker) => !js.includes(marker)),
];

if (missing.length) {
  console.error(`Missing footprint requirements:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Footprint page structure verified.");
