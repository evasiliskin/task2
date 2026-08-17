import { expect, test } from '@playwright/test';
import { mockOpenverseSearch } from './openverse-mock';

test('names the preview dialog and its canvas for assistive technology, when a result is opened', async ({
  page,
}) => {
  const servedPages = new Set<number>();
  await mockOpenverseSearch(page, servedPages);
  await page.goto('/');

  await page.getByLabel('Search images').fill('mountains');
  const firstResult = page.locator('.search-result-item').first();
  await expect(firstResult).toBeVisible();

  const resultTitle = (await firstResult.locator('.search-result-item__title').textContent()) ?? '';
  await expect(firstResult.getByRole('button')).toHaveAccessibleName(
    `Open ${resultTitle} in the polygon editor`,
  );

  await firstResult.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAccessibleName(resultTitle);

  const canvas = page.locator('canvas.polygon-canvas__overlay');
  await expect(canvas).toHaveAccessibleDescription(/arrow keys move it/);
});
