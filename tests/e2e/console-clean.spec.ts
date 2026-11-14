import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/discover',
  '/movies-like',
  '/movies-like/101-until-dawn',
  '/watch-order',
  '/watch-order/lord-of-the-rings',
  '/watch-party',
  '/rules',
  '/privacy',
];

for (const route of ROUTES) {
  test(`Route "${route}" renders with 0 console errors and 0 hydration warnings`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const hydrationWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Exclude transient external media fetch fails if offline
        if (!text.includes('Failed to load resource') && !text.includes('net::ERR_')) {
          consoleErrors.push(text);
        }
      }
      if (text.toLowerCase().includes('hydration') || text.toLowerCase().includes('did not match')) {
        hydrationWarnings.push(text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    // Verify page content rendered
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(hydrationWarnings).toEqual([]);
  });
}

