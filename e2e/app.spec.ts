import { test, expect } from '@playwright/test';

test.describe('ERU Cinema App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load and display the main UI', async ({ page }) => {
    // Check for title bar
    await expect(page.locator('text=ERU')).toBeVisible({ timeout: 10000 });

    // Check for sidebar
    await expect(page.locator('text=Discover')).toBeVisible();
    await expect(page.locator('text=Movies')).toBeVisible();
    await expect(page.locator('text=TV Shows')).toBeVisible();
    await expect(page.locator('text=Watchlist')).toBeVisible();
    await expect(page.locator('text=History')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click Movies tab
    await page.click('text=Movies');
    await expect(page.locator('text=Movies')).toBeVisible();

    // Click TV Shows tab
    await page.click('text=TV Shows');
    await expect(page.locator('text=TV Shows')).toBeVisible();

    // Click Watchlist tab
    await page.click('text=Watchlist');
    await expect(page.locator('text=My Watchlist is Empty')).toBeVisible();

    // Click History tab
    await page.click('text=History');
    await expect(page.locator('text=No Watch History Yet')).toBeVisible();

    // Go back to Discover
    await page.click('text=Discover');
    await expect(page.locator('text=Trending & Popular')).toBeVisible();
  });

  test('should open search and filter results', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('inception');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show results
    await expect(page.locator('text=Results for "inception"')).toBeVisible();

    // Clear search
    await page.click('text=Clear');
    await expect(page.locator('text=Trending & Popular')).toBeVisible();
  });

  test('should open settings modal', async ({ page }) => {
    // Click settings button in sidebar
    await page.click('button[title="Settings"]');

    // Settings modal should appear
    await expect(page.locator('text=Settings')).toBeVisible();

    // Close modal
    await page.click('button[aria-label="Close"]');
    await expect(page.locator('text=Settings')).not.toBeVisible();
  });

  test('should show media cards with posters', async ({ page }) => {
    // Wait for media grid to load
    await page.waitForSelector('[class*="MediaCard"]', { timeout: 15000 });

    // Check that at least one media card is visible
    const cards = page.locator('[class*="MediaCard"]');
    await expect(cards.first()).toBeVisible();

    // Check for poster image or placeholder
    const firstCard = cards.first();
    await expect(firstCard.locator('img, [class*="placeholder"]')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();

    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Check sidebar has nav role
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
  });
});