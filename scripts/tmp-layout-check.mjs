import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { height: 900, width: 1440 },
});
const page = await context.newPage();

// Sign in
await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "layout-check-1791580000@gmail.com");
await page.fill('input[name="password"]', "LayoutCheck123!");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log("after sign in url:", page.url());

// Go to new-source
await page.goto("http://localhost:3000/new-source", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => {
  const aside = document.querySelector("aside");
  const main = document.querySelector("main");
  const grid = document.querySelector("aside")?.parentElement;
  const asideBox = aside?.getBoundingClientRect();
  const mainBox = main?.getBoundingClientRect();
  return {
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    asideHeight: aside?.offsetHeight,
    asideTop: asideBox?.top,
    asideBottom: asideBox?.bottom,
    mainHeight: main?.offsetHeight,
    mainBottom: mainBox?.bottom,
    gridHeight: grid?.offsetHeight,
    bodyHeight: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(metrics, null, 2));

await page.screenshot({ path: "layout-new-source.png", fullPage: true });

// Also capture sources page for comparison
await page.goto("http://localhost:3000/sources", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1000);
const sourcesMetrics = await page.evaluate(() => {
  const aside = document.querySelector("aside");
  return {
    scrollHeight: document.documentElement.scrollHeight,
    asideHeight: aside?.offsetHeight,
  };
});
console.log("sources:", JSON.stringify(sourcesMetrics, null, 2));
await page.screenshot({ path: "layout-sources.png", fullPage: true });

await browser.close();
