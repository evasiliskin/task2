import { expect, test } from '@playwright/test';
import { mockOpenverseSearch } from './openverse-mock';

test('keeps the search results usable and free of horizontal overflow on a phone viewport', async ({ page }) => {
  await mockOpenverseSearch(page, new Set<number>());
  await page.goto('/');

  await page.getByLabel('Search images').fill('mountains');
  await expect(page.locator('.search-result-item').first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the page must not scroll horizontally').toBeLessThanOrEqual(1);

  await page.locator('.search-result-item').first().tap();
  await expect(page.locator('.ant-modal')).toBeVisible();
  await expect(page.locator('canvas.polygon-canvas__overlay')).toBeVisible();
});
