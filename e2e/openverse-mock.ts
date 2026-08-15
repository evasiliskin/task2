import { Page, Route } from '@playwright/test';
import { SEARCH_RESULTS_PAGE_SIZE } from '../src/app/core/api/openverse/openverse-api.config';
import type {
  OpenverseImageDto,
  OpenverseSearchResponseDto,
} from '../src/app/features/search/data-access/openverse-image.dto';

const SEARCH_QUERY = 'mountains';
const MOCK_TOTAL_PAGES = 5;

const MOCK_IMAGE_WIDTH_PX = 960;
const MOCK_IMAGE_HEIGHT_PX = 540;
const MOCK_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAAIcCAIAAAC2P1AsAAAKaUlEQVR4nO3WsQkAIBDAQPef52tncwVTiXBwA6TMmtkAAMCl9bwAAAA+YqABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBhoAAAIDDQAAAQGGgAAAgMNAACBgQYAgMBAAwBAYKABACAw0AAAEBzXJJTy1rk3sQAAAABJRU5ErkJggg==';

const STABLE_VALUE_POLL_MS = 100;
const STABLE_VALUE_MAX_ATTEMPTS = 20;

export function buildMockPage(query: string, page: number): OpenverseSearchResponseDto {
  const results: OpenverseImageDto[] = Array.from(
    { length: SEARCH_RESULTS_PAGE_SIZE },
    (_unused, index) => {
      const id = `${query}-p${page}-i${index}`;
      return {
        id,
        title: `Result ${page}-${index}`,
        url: MOCK_IMAGE_DATA_URL,
        thumbnail: MOCK_IMAGE_DATA_URL,
        width: MOCK_IMAGE_WIDTH_PX,
        height: MOCK_IMAGE_HEIGHT_PX,
        creator: 'Test Photographer',
        foreign_landing_url: `https://example.invalid/${id}`,
      };
    },
  );
  return {
    result_count: MOCK_TOTAL_PAGES * SEARCH_RESULTS_PAGE_SIZE,
    page_count: MOCK_TOTAL_PAGES,
    results,
  };
}

export async function mockOpenverseSearch(page: Page, servedPages: Set<number>): Promise<void> {
  await page.route('**/v1/images/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const requestedPage = Number(url.searchParams.get('page') ?? '1');
    servedPages.add(requestedPage);
    await route.fulfill({ json: buildMockPage(SEARCH_QUERY, requestedPage) });
  });
}

export async function readCanvasDataUrl(page: Page) {
  return page.locator('canvas.polygon-canvas__overlay').evaluate((element) => {
    return (element as HTMLCanvasElement).toDataURL();
  });
}

/**
 * The dialog's zoom-in entrance animation and the canvas's own
 * ResizeObserver -> requestAnimationFrame render pipeline both run after the
 * "polygon exists" text becomes visible, so a single read right after that
 * text appears can catch an in-between frame (or the browser's un-sized
 * 300x150 canvas default). Poll until two consecutive reads agree.
 */
export async function waitForStableCanvasDataUrl(page: Page): Promise<string> {
  let previous = await readCanvasDataUrl(page);
  for (let attempt = 0; attempt < STABLE_VALUE_MAX_ATTEMPTS; attempt++) {
    await page.waitForTimeout(STABLE_VALUE_POLL_MS);
    const current = await readCanvasDataUrl(page);
    if (current === previous) {
      return current;
    }
    previous = current;
  }
  throw new Error('canvas did not settle to a stable frame in time');
}

export async function waitForStableCanvasBox(page: Page) {
  const canvas = page.locator('canvas.polygon-canvas__overlay');
  let previous = await canvas.boundingBox();
  for (let attempt = 0; attempt < STABLE_VALUE_MAX_ATTEMPTS; attempt++) {
    await page.waitForTimeout(STABLE_VALUE_POLL_MS);
    const current = await canvas.boundingBox();
    if (
      previous &&
      current &&
      previous.x === current.x &&
      previous.y === current.y &&
      previous.width === current.width &&
      previous.height === current.height
    ) {
      return current;
    }
    previous = current;
  }
  throw new Error('polygon canvas bounding box did not settle in time');
}
