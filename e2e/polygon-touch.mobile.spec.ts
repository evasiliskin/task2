import { expect, test } from '@playwright/test';
import { mockOpenverseSearch, waitForStableCanvasBox, waitForStableCanvasDataUrl } from './openverse-mock';

const TRIANGLE = [
  { x: 0.3, y: 0.7 },
  { x: 0.5, y: 0.3 },
  { x: 0.7, y: 0.7 },
] as const;

test('completes a touch drag without raising a page error', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await mockOpenverseSearch(page, new Set<number>());
  await page.goto('/');
  await page.getByLabel('Search images').fill('mountains');
  await page.locator('.search-result-item').first().tap();

  const canvas = page.locator('canvas.polygon-canvas__overlay');
  const box = await waitForStableCanvasBox(page);

  await page.getByRole('button', { name: 'Draw polygon' }).tap();
  for (const point of TRIANGLE) {
    await canvas.tap({ position: { x: box.width * point.x, y: box.height * point.y } });
  }
  await page.getByRole('button', { name: 'Finish polygon' }).tap();
  await expect(page.getByText('Polygon 1 of 1')).toBeVisible();

  const beforeDrag = await waitForStableCanvasDataUrl(page);

  // Playwright's `locator.dispatchEvent` fires a JS-level synthetic event that the browser
  // never registers as an "active" pointer, so `canvas.setPointerCapture` (called by the app on
  // every gesture start) throws `NotFoundError` and the drag never begins. Driving real touch
  // input through the CDP `Input.dispatchTouchEvent` pipeline (the same mechanism Playwright's
  // own `tap()` uses) produces a genuinely active pointer, exercising the real touch-drag path.
  const centre = { x: box.width * 0.5, y: box.height * 0.567 };
  const start = { x: box.x + centre.x, y: box.y + centre.y };
  const end = { x: start.x + 40, y: start.y + 20 };
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: end.x, y: end.y }],
  });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  const afterDrag = await waitForStableCanvasDataUrl(page);

  expect(afterDrag, 'the touch drag should have moved the polygon').not.toBe(beforeDrag);
  expect(pageErrors.map((error) => error.message), 'touch teardown must not throw').toEqual([]);
});
