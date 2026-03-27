/**
 * Playwright browser singleton for JavaScript-rendered page scraping.
 * Reuses a single Chromium instance across connector calls.
 */
import { chromium, type Browser } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browser;
}

export async function fetchRenderedHtml(url: string, waitMs = 2000): Promise<string> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    // Wait for JS to render
    await page.waitForTimeout(waitMs);
    return await page.content();
  } finally {
    await page.close();
  }
}
