import { expect, test } from '@playwright/test';
import { mockOpenverseSearch } from './openverse-mock';

test('runs a suggested past query, when it is tapped on a phone viewport', async ({ page }) => {
  const servedPages = new Set<number>();
  await mockOpenverseSearch(page, servedPages);
  await page.goto('/');

  await page.getByLabel('Search images').fill('mountains');
  await expect(page.locator('.search-result-item').first()).toBeVisible();

  await page.getByLabel('Search images').fill('moun');
  const suggestion = page.getByRole('option', { name: 'mountains' });
  await expect(suggestion).toBeVisible();

  await suggestion.tap();

  await expect(page.getByLabel('Search images')).toHaveValue('mountains');
  await expect(page.locator('.search-result-item').first()).toBeVisible();
});
