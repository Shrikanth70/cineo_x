import { test, expect } from '@playwright/test';

test.describe('Cinéo Watch Party Workflows', () => {
  test('Landing renders and host can start party and copy invite link', async ({ page }) => {
    await page.goto('/watch-party');

    // Verify H1 headline
    await expect(page.locator('h1')).toContainText('Watch together');

    // Fill party title
    const watchingInput = page.locator('#watching-input');
    await watchingInput.fill('Until Dawn Midnight');

    // Click Start a watch party
    await page.click('button:has-text("Start a watch party")');

    // Join dialog modal opens
    const joinModal = page.locator('div[role="dialog"]');
    await expect(joinModal).toBeVisible();

    // Fill nickname
    await page.locator('#join-name').fill('Host Alex');

    // Pick avatar (e.g. popcorn)
    await page.locator('button[aria-label="Popcorn"]').click();

    // Check 18+ agreement checkbox
    const checkbox = page.locator('input[type="checkbox"]').nth(1); // 18+ checkbox
    await checkbox.check();

    // Click Join the party
    await page.click('button:has-text("Join the party")');

    // Should navigate to room /watch-party/CIN-***
    await page.waitForURL(/\/watch-party\/CIN-/);
    await expect(page.locator('h1')).toContainText('Until Dawn Midnight');

    // Verify invite button
    const shareBtn = page.locator('button:has-text("Share Invite")');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    await expect(page.locator('button:has-text("Link Copied!")')).toBeVisible();
  });

  test('Multi-user room sync: Two browser contexts join, sync presence, chat, reactions, ready count and countdown', async ({
    browser,
  }) => {
    const roomCode = 'CIN-TEST-PLAY';

    // 1. Host Context (Alex)
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await hostPage.goto(`/watch-party/${roomCode}`);

    // Join dialog for host
    await hostPage.locator('#join-name').fill('Host Alex');
    await hostPage.locator('button[aria-label="Popcorn"]').click();
    await hostPage.locator('input[type="checkbox"]').nth(1).check();
    await hostPage.click('button:has-text("Join the party")');

    // Wait for room to initialize
    await expect(hostPage.locator('button:has-text("Play for everyone")')).toBeVisible();

    // 2. Guest Context (Sam) joins via link
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/watch-party/${roomCode}`);

    // Guest sees join dialog
    await expect(guestPage.locator('div[role="dialog"]')).toBeVisible();
    await guestPage.locator('#join-name').fill('Guest Sam');
    await guestPage.locator('button[aria-label="Panda"]').click();
    await guestPage.locator('input[type="checkbox"]').nth(1).check();
    await guestPage.click('button:has-text("Join the party")');

    // Wait for guest to enter
    await expect(guestPage.locator('text=Paused by Host')).toBeVisible();

    // 3. Presence Verification on Both sides (2 participants in strip)
    await expect(hostPage.getByText('Guest Sam', { exact: true })).toBeVisible();
    await expect(guestPage.getByText('Host Alex', { exact: true })).toBeVisible();

    // 4. Chat exchange
    const hostMobileChatBtn = hostPage.locator('button:has(svg.lucide-message-square)');
    if (await hostMobileChatBtn.isVisible()) {
      await hostMobileChatBtn.click();
    }

    const chatInput = hostPage.locator('input[placeholder*="Type a message"]');
    await chatInput.fill('Popcorn is ready!');
    await hostPage.locator('button[type="submit"]').last().click();

    const guestMobileChatBtn = guestPage.locator('button:has(svg.lucide-message-square)');
    if (await guestMobileChatBtn.isVisible()) {
      await guestMobileChatBtn.click();
    }

    await expect(guestPage.locator('text=Popcorn is ready!')).toBeVisible();

    // Close mobile chat if open to reveal reactions & controls
    if (await hostMobileChatBtn.isVisible()) {
      const closeBtn = hostPage.locator('button[aria-label="Close Chat"]');
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
    if (await guestMobileChatBtn.isVisible()) {
      const closeBtn = guestPage.locator('button[aria-label="Close Chat"]');
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    // 5. Emoji Reaction
    await guestPage.locator('button[aria-label="React with 🔥"]').click();
    await expect(hostPage.locator('div:has-text("🔥")').first()).toBeVisible();

    // 6. Both press "I'm ready" -> counter reads 2/2
    await hostPage.click('button:has-text("I\'m ready")');
    await expect(hostPage.locator('text=1/2')).toBeVisible();

    await guestPage.click('button:has-text("I\'m ready")');
    await expect(hostPage.locator('text=2/2')).toBeVisible();
    await expect(guestPage.locator('text=2/2')).toBeVisible();

    // 7. Host starts synchronized play -> countdown triggers
    await hostPage.click('button:has-text("Play for everyone")');
    await expect(hostPage.locator('text=Synchronized Party Start')).toBeVisible();
    await expect(guestPage.locator('text=Synchronized Party Start')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('Guest reload auto-rejoins from localStorage', async ({ page }) => {
    const roomCode = 'CIN-TEST-RELOAD';
    await page.goto(`/watch-party/${roomCode}`);

    await page.locator('#join-name').fill('Robin');
    await page.locator('button[aria-label="Fox"]').click();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.click('button:has-text("Join the party")');

    await expect(page.locator('button:has-text("Play for everyone")')).toBeVisible();

    // Reload page
    await page.reload();

    // Auto-rejoined directly without re-prompting
    await expect(page.locator('button:has-text("Play for everyone")')).toBeVisible();
    await expect(page.locator('text=Robin (you)')).toBeVisible();
  });

  test('Microphone, camera, and screen share controls operate cleanly', async ({ page }) => {
    const roomCode = 'CIN-TEST-MEDIA';
    await page.goto(`/watch-party/${roomCode}`);

    await page.locator('#join-name').fill('Media Tester');
    await page.locator('button[aria-label="Alien"]').click();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.click('button:has-text("Join the party")');

    await expect(page.locator('button:has-text("Play for everyone")')).toBeVisible();

    // 1. Microphone Toggle
    const micBtn = page.locator('button[title*="microphone"]');
    await expect(micBtn).toBeVisible();
    await micBtn.click(); // mute
    await expect(page.locator('button[title="Unmute microphone"]')).toBeVisible();
    await micBtn.click(); // unmute
    await expect(page.locator('button[title="Mute microphone"]')).toBeVisible();

    // 2. Camera Toggle
    const cameraBtn = page.locator('button[title*="camera"]');
    await expect(cameraBtn).toBeVisible();
    await cameraBtn.click(); // toggle camera on
    await expect(page.locator('button[title="Turn off camera"]')).toBeVisible();
    await cameraBtn.click(); // toggle camera off
    await expect(page.locator('button[title="Turn on camera"]')).toBeVisible();

    // 3. Screen Share Tab
    await page.click('button:has-text("Screen share")');
    await expect(page.locator('text=Share Your Screen')).toBeVisible();
    // On desktop, the Share my screen button or fallback is present
    const shareBtn = page.locator('button:has-text("Share my screen")');
    const unsupportedNotice = page.locator('text=Screen sharing is not supported');
    await expect(shareBtn.or(unsupportedNotice)).toBeVisible();
  });
});
