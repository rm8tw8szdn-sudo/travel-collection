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

assert.equal = (actual, expected, message) => {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
};

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
  assert(await page.locator("[data-route-open='nordic-aurora']").isVisible(), "route cards should still open route detail");
  assert.equal(await page.locator("text=涉及国家").count(), 0, "route list should not expose involved-country entry");

  await page.click("[data-route-open='nordic-aurora']");
  await page.waitForURL(/route-nordic\.html$/);

  assert((await text(page, ".route-detail-title")).includes("北欧极光线"), "route detail title should render");
  assert((await text(page, ".route-detail-summary")).includes("建议天数"), "summary info card should render");
  assert.equal(await page.locator("[data-route-countries]").count(), 0, "route detail should not show country secondary entries");
  assert((await text(page, "[data-route-cities]")).includes("奥斯陆"), "recommended city cards should render");
  assert((await text(page, "[data-route-highlights]")).includes("极光"), "route highlights should render");

  await page.click("[data-route-back]");
  await page.waitForURL(/routes\.html$/);
} finally {
  await browser.close();
}

console.log("Route detail verified.");
