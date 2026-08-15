import { expect, test } from '@playwright/test';
import { mockOpenverseSearch } from './openverse-mock';

test('suggests a past query and runs it when selected', async ({ page }) => {
  const servedPages = new Set<number>();
  await mockOpenverseSearch(page, servedPages);
  await page.goto('/');

  await page.getByLabel('Search images').fill('mountains');
  await expect(page.locator('.search-result-item').first()).toBeVisible();

  await page.getByLabel('Search images').fill('moun');
  const suggestion = page.getByRole('menuitem', { name: 'mountains' });
  await expect(suggestion).toBeVisible();

  await suggestion.click();

  await expect(page.getByLabel('Search images')).toHaveValue('mountains');
  await expect(page.locator('.search-result-item').first()).toBeVisible();
});
