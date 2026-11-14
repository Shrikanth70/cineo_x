const { chromium, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\Bhukya Shrikanth\\.gemini\\antigravity\\brain\\62813737-a8c1-4ea1-abeb-134e20412e95\\screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Home Page Mobile
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'mobile-home.png'), fullPage: false });
  console.log('Captured mobile-home.png');

  // 1b. Desktop Home Page with Three.js Hero
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(outDir, 'desktop-threejs-hero.png'), fullPage: false });
  console.log('Captured desktop-threejs-hero.png');
  await desktopPage.close();

  // 2. Open Hamburger Menu
  await page.click('button[aria-label="Toggle Navigation Menu"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'mobile-menu-open.png'), fullPage: false });
  console.log('Captured mobile-menu-open.png');

  // 3. Watch Party Landing Mobile
  await page.goto('http://localhost:3000/watch-party', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'mobile-watch-party.png'), fullPage: false });
  console.log('Captured mobile-watch-party.png');

  // 4. Watch Party Room Mobile
  await page.goto('http://localhost:3000/watch-party/CIN-LIVE-777', { waitUntil: 'networkidle' });
  await page.fill('#join-name', 'Mobile Alex');
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.click('button:has-text("Join the party")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, 'mobile-party-room.png'), fullPage: false });
  console.log('Captured mobile-party-room.png');

  await browser.close();
  console.log('All mobile screenshots generated successfully');
})();

