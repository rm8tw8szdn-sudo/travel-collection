import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const urlFor = (file) => `file://${path.join(root, file)}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(page, selector) {
  return (await page.locator(selector).innerText()).replace(/\s+/g, " ").trim();
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

try {
  const context = await browser.newContext({ viewport: { width: 275, height: 515 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.goto(urlFor("routes.html"));
  await page.click("[data-route-name='北欧极光线']");
  await page.waitForURL(/route-nordic\.html$/);

  assert((await text(page, ".route-detail-title")).includes("北欧极光之旅"), "route detail title should render");
  assert((await text(page, ".route-detail-summary")).includes("建议天数"), "summary info card should render");
  assert((await text(page, "[data-route-countries]")).includes("挪威"), "included country cards should render");
  assert((await text(page, "[data-route-cities]")).includes("奥斯陆"), "recommended city cards should render");
  assert((await text(page, "[data-route-highlights]")).includes("追寻极光"), "route highlights should render");

  await page.click("[data-route-favorite]");
  assert(await page.locator("[data-route-favorite].favorited").isVisible(), "favorite button should toggle on");

  await page.click("[data-route-share]");
  await page.locator("[data-share-card-modal]").waitFor({ state: "visible" });
  assert((await text(page, "[data-share-card-modal]")).includes("路线"), "route share modal should open");
  await page.click("[data-close-modal]");

  await page.click("[data-country-link='NO']");
  await page.waitForURL(/country-japan\.html#country-NO$/);
  await page.goBack();

  await page.click("[data-city-link='oslo']");
  await page.waitForURL(/city-oslo\.html$/);
  await page.goBack();

  await page.click("[data-related-route='nordic-winter']");
  await page.waitForURL(/route-nordic\.html#nordic-winter$/);
  await page.goBack();

  await page.click("[data-route-back]");
  await page.waitForURL(/routes\.html$/);
} finally {
  await browser.close();
}

console.log("Route detail verified.");
