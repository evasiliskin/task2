import { expect, test } from '@playwright/test';
import {
  mockOpenverseSearch,
  waitForStableCanvasBox,
  waitForStableCanvasDataUrl,
} from './openverse-mock';

/**
 * Covers the three defects this review pass fixed that jsdom cannot exercise:
 * the near-end pagination trigger, the flex layout at short viewports, and
 * (transitively, by keeping the image mock always resolvable) the image
 * error path staying out of the way of a normal draw/drag flow.
 */

const VIEWPORT_WIDTH_PX = 1280;
const VIEWPORT_HEIGHTS_PX = {
  short: 640,
  medium: 900,
  tall: 1200,
} as const;

const SEARCH_QUERY = 'mountains';
const PAGINATION_TARGET_PAGE = 3;
const MAX_SCROLL_ATTEMPTS = 40;
const SCROLL_STEP_PX = 900;
const SCROLL_SETTLE_MS = 150;

const DRAW_POINT_RATIOS = [
  { x: 0.3, y: 0.75 },
  { x: 0.5, y: 0.25 },
  { x: 0.7, y: 0.75 },
] as const;
const POLYGON_CENTROID_RATIO = {
  x: DRAW_POINT_RATIOS.reduce((sum, point) => sum + point.x, 0) / DRAW_POINT_RATIOS.length,
  y: DRAW_POINT_RATIOS.reduce((sum, point) => sum + point.y, 0) / DRAW_POINT_RATIOS.length,
};
const DRAG_OFFSET_PX = { x: 70, y: -50 };
const DRAG_MOVE_STEPS = 10;

for (const [heightLabel, viewportHeight] of Object.entries(VIEWPORT_HEIGHTS_PX)) {
  test(`search, paginate, draw and persist a polygon at a ${heightLabel} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: VIEWPORT_WIDTH_PX, height: viewportHeight });

    const servedPages = new Set<number>();
    await mockOpenverseSearch(page, servedPages);

    await page.goto('/');

    await page.getByLabel('Search images').fill(SEARCH_QUERY);
    await expect(page.locator('.search-result-item').first()).toBeVisible();
    await expect.poll(() => servedPages.has(1)).toBe(true);

    const viewport = page.locator('cdk-virtual-scroll-viewport');
    for (
      let attempt = 0;
      attempt < MAX_SCROLL_ATTEMPTS && !servedPages.has(PAGINATION_TARGET_PAGE);
      attempt++
    ) {
      await viewport.hover();
      await page.mouse.wheel(0, SCROLL_STEP_PX);
      // CDK's scrolledIndexChange is dispatched on the next animation frame
      // after a scroll event, so a real batch of results needs a moment to
      // land before the next wheel tick is evaluated against it.
      await page.waitForTimeout(SCROLL_SETTLE_MS);
    }
    expect(
      servedPages.has(PAGINATION_TARGET_PAGE),
      `expected pagination to reach page ${PAGINATION_TARGET_PAGE}, only saw pages ${[...servedPages].sort().join(', ')}`,
    ).toBe(true);

    const targetItem = page.locator('.search-result-item').first();
    const targetTitle = await targetItem.locator('.search-result-item__title').textContent();
    expect(targetTitle).toBeTruthy();

    await targetItem.click();

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ant-modal-title')).toHaveText(targetTitle ?? '');

    const canvas = page.locator('canvas.polygon-canvas__overlay');
    await canvas.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Draw polygon' }).click();
    await expect(page.getByText('Click the image to place the first point.')).toBeVisible();

    let box = await waitForStableCanvasBox(page);
    for (const point of DRAW_POINT_RATIOS) {
      await canvas.click({
        position: { x: box.width * point.x, y: box.height * point.y },
      });
    }
    await page.getByRole('button', { name: 'Finish polygon' }).click();
    await expect(page.getByText('Polygon 1 of 1')).toBeVisible();

    const afterDrawDataUrl = await waitForStableCanvasDataUrl(page);

    box = await waitForStableCanvasBox(page);
    const centroidPx = {
      x: box.x + box.width * POLYGON_CENTROID_RATIO.x,
      y: box.y + box.height * POLYGON_CENTROID_RATIO.y,
    };
    const draggedToPx = {
      x: centroidPx.x + DRAG_OFFSET_PX.x,
      y: centroidPx.y + DRAG_OFFSET_PX.y,
    };

    await page.mouse.move(centroidPx.x, centroidPx.y);
    await page.mouse.down();
    await page.mouse.move(draggedToPx.x, draggedToPx.y, { steps: DRAG_MOVE_STEPS });
    await page.mouse.up();

    const afterDragDataUrl = await waitForStableCanvasDataUrl(page);
    expect(afterDragDataUrl, 'dragging the polygon should change the rendered canvas').not.toBe(
      afterDrawDataUrl,
    );

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(modal).toBeHidden();

    await page
      .locator('.search-result-item')
      .filter({ hasText: targetTitle ?? '' })
      .first()
      .click();
    const reopenedModal = page.locator('.ant-modal');
    await expect(reopenedModal).toBeVisible();
    await expect(page.getByText('Polygon 1 of 1')).toBeVisible();

    const reopenedDataUrl = await waitForStableCanvasDataUrl(page);
    expect(
      reopenedDataUrl,
      'reopening the dialog for the same image should restore the dragged polygon position',
    ).toBe(afterDragDataUrl);
  });
}
