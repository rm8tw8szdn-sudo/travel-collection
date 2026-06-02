import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const urlFor = (file) => `file://${path.join(root, file)}`;
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

  await page.goto(urlFor("country-japan.html"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  assert(await page.locator("[data-explore-toggle]").isVisible(), "country detail should expose an explore toggle");
  await page.click("[data-explore-toggle]");
  await page.locator("[data-explore-modal]").waitFor({ state: "visible" });
  assert((await text(page, "[data-explore-modal]")).includes("标记为已探索"), "explore modal title should be visible");
  await page.click("[data-save-explore]");

  assert((await text(page, "[data-explore-toggle]")).includes("已去"), "saving should switch country status to visited");
  const recordText = await text(page, "[data-visit-record]");
  assert(recordText.includes("状态：已去"), "record should show visited status");
  assert(recordText.includes("去过时间：2026.05.20"), "record should show visited date");
  assert(recordText.includes("停留天数：5天"), "record should show stay days");
  assert(recordText.includes("笔记：12条"), "record should show note count");

  await page.goto(urlFor("mobile.html"));
  assert((await text(page, ".home-stat-number")).includes("12"), "home explored count should update after saving");
  await page.goto(urlFor("profile.html"));
  assert((await text(page, ".profile-stats")).includes("46"), "profile footprint count should update after saving");
  await page.goto(urlFor("country-japan.html"));

  await page.click("[data-record-more]");
  await page.locator("[data-record-menu]").waitFor({ state: "visible" });
  assert((await text(page, "[data-record-menu]")).includes("标记为未去"), "record menu should include mark unvisited");
  await page.click("[data-mark-unvisited]");
  assert((await text(page, "[data-explore-toggle]")).includes("未去"), "mark unvisited should switch status back");

  await page.goto(urlFor("trips.html"));
  await page.click("[data-new-trip]");
  await page.locator("[data-trip-step='1']").waitFor({ state: "visible" });
  assert((await text(page, "[data-trip-modal]")).includes("行程基本信息"), "trip step 1 should be visible");
  await page.click("[data-trip-next]");

  await page.locator("[data-trip-step='2']").waitFor({ state: "visible" });
  const step2Text = await text(page, "[data-trip-modal]");
  assert(step2Text.includes("添加国家 / 城市"), "trip step 2 should be visible");
  assert(step2Text.includes("挪威") && step2Text.includes("冰岛") && step2Text.includes("芬兰"), "trip step 2 should show selected chips");
  await page.click("[data-trip-step='2'] [data-trip-next]");

  await page.locator("[data-trip-step='3']").waitFor({ state: "visible" });
  const previewText = await text(page, "[data-trip-preview]");
  assert(previewText.includes("北欧极光之旅"), "trip preview should show trip title");
  assert(previewText.includes("挪威 · 冰岛 · 芬兰"), "trip preview should show places");
  assert(previewText.includes("2026.07.18 - 07.30"), "trip preview should show dates");
  assert(previewText.includes("12天 · 3国"), "trip preview should show summary");
  await page.click("[data-create-trip]");
  assert(await page.locator("[data-trip-modal]").isHidden(), "creating trip should close modal");
  assert((await text(page, "[data-trip-list-upcoming]")).includes("北欧极光之旅"), "new trip should appear in upcoming trips");

  await page.goto(urlFor("mobile.html"));
  assert((await text(page, "trip-preview-card")).includes("北欧极光之旅"), "home next target should use latest future trip");

  await page.goto(urlFor("profile.html"));
  assert((await text(page, ".profile-stats")).includes("足迹地点"), "profile footprint stats should still render after flow");
} finally {
  await browser.close();
}

console.log("Interaction flows verified.");
