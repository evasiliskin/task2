import { expect, test } from '@playwright/test';
import {
  mockOpenverseSearch,
  waitForStableCanvasBox,
  waitForStableCanvasDataUrl,
} from './openverse-mock';

const FIRST_TRIANGLE = [
  { x: 0.2, y: 0.7 },
  { x: 0.35, y: 0.3 },
  { x: 0.5, y: 0.7 },
] as const;
const SECOND_TRIANGLE = [
  { x: 0.55, y: 0.7 },
  { x: 0.7, y: 0.3 },
  { x: 0.85, y: 0.7 },
] as const;

test('draws two polygons on one image, scales one, and restores both on reopen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockOpenverseSearch(page, new Set<number>());
  await page.goto('/');
  await page.getByLabel('Search images').fill('mountains');
  await page.locator('.search-result-item').first().click();

  const canvas = page.locator('canvas.polygon-canvas__overlay');
  let box = await waitForStableCanvasBox(page);

  for (const points of [FIRST_TRIANGLE, SECOND_TRIANGLE]) {
    await page.getByRole('button', { name: 'Draw polygon' }).click();
    for (const point of points) {
      await canvas.click({ position: { x: box.width * point.x, y: box.height * point.y } });
    }
    await page.getByRole('button', { name: 'Finish polygon' }).click();
  }

  await expect(page.getByText('Polygon 2 of 2')).toBeVisible();

  const beforeScale = await waitForStableCanvasDataUrl(page);
  await canvas.focus();
  await page.keyboard.press('+');
  const afterScale = await waitForStableCanvasDataUrl(page);
  expect(afterScale, 'scaling should change the rendered canvas').not.toBe(beforeScale);

  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('.search-result-item').first().click();
  await expect(page.getByText('Polygon 2 of 2')).toBeVisible();

  const reopened = await waitForStableCanvasDataUrl(page);
  expect(reopened, 'both polygons should be restored at their stored scale').toBe(afterScale);
});
