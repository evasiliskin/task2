import { Page, expect, test } from '@playwright/test';
import {
  mockOpenverseSearch,
  waitForStableCanvasBox,
  waitForStableCanvasDataUrl,
} from './openverse-mock';

const TRIANGLE = [
  { x: 0.3, y: 0.75 },
  { x: 0.5, y: 0.25 },
  { x: 0.7, y: 0.75 },
] as const;

async function relativeInkBounds(page: Page) {
  return page.locator('canvas.polygon-canvas__overlay').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('no 2d context');
    }
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] === 0) {
        continue;
      }
      const pixel = (index - 3) / 4;
      const x = pixel % canvas.width;
      const y = Math.floor(pixel / canvas.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return {
      minX: minX / canvas.width,
      minY: minY / canvas.height,
      maxX: maxX / canvas.width,
      maxY: maxY / canvas.height,
    };
  });
}

test('keeps a polygon proportional to the canvas box across a viewport resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockOpenverseSearch(page, new Set<number>());
  await page.goto('/');
  await page.getByLabel('Search images').fill('mountains');
  await page.locator('.search-result-item').first().click();

  const canvas = page.locator('canvas.polygon-canvas__overlay');
  const box = await waitForStableCanvasBox(page);

  await page.getByRole('button', { name: 'Draw polygon' }).click();
  for (const point of TRIANGLE) {
    await canvas.click({ position: { x: box.width * point.x, y: box.height * point.y } });
  }
  await page.getByRole('button', { name: 'Finish polygon' }).click();
  await expect(page.getByText('Polygon 1 of 1')).toBeVisible();

  await canvas.focus();
  await page.keyboard.press(']');
  await page.keyboard.press('+');
  await waitForStableCanvasDataUrl(page);

  const before = await relativeInkBounds(page);
  await page.setViewportSize({ width: 900, height: 900 });
  await waitForStableCanvasBox(page);
  const after = await relativeInkBounds(page);

  for (const key of ['minX', 'minY', 'maxX', 'maxY'] as const) {
    expect(Math.abs(after[key] - before[key]), `${key} drifted on resize`).toBeLessThan(0.01);
  }
});
