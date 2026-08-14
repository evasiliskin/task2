import { NEAR_END_PREFETCH_ROWS, shouldLoadNextPage } from './should-load-next-page';

const base = {
  firstVisibleIndex: 0,
  visibleRowCount: 8,
  loadedCount: 100,
  hasMoreResults: true,
  isLoadingMore: false,
  isLoadingMoreError: false,
};

describe('shouldLoadNextPage', () => {
  it('should not trigger, when the last visible row is far from the end', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 0 })).toBe(false);
  });

  it('should trigger, when the last visible row is within the prefetch window of the end', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 84 })).toBe(true);
  });

  it('should trigger on a tall viewport at the bottom, where a first-visible-index rule would not', () => {
    // 12 visible rows on a 1440p-class viewport. The old rule compared
    // loadedCount - firstVisibleIndex (= 12) against 8 and never fired.
    expect(
      shouldLoadNextPage({ ...base, firstVisibleIndex: 88, visibleRowCount: 12, loadedCount: 100 }),
    ).toBe(true);
  });

  it('should trigger on a short viewport at the bottom', () => {
    expect(
      shouldLoadNextPage({ ...base, firstVisibleIndex: 96, visibleRowCount: 4, loadedCount: 100 }),
    ).toBe(true);
  });

  it('should not trigger, when there are no more results', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 90, hasMoreResults: false })).toBe(
      false,
    );
  });

  it('should not trigger, when a page is already loading', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 90, isLoadingMore: true })).toBe(false);
  });

  it('should not trigger, when a load-more error is showing', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 90, isLoadingMoreError: true })).toBe(
      false,
    );
  });

  it('should trigger when the whole list fits in the viewport and more pages exist', () => {
    expect(
      shouldLoadNextPage({ ...base, firstVisibleIndex: 0, visibleRowCount: 12, loadedCount: 5 }),
    ).toBe(true);
  });

  it('should honour an explicit prefetch window', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 80, visibleRowCount: 8 }, 20)).toBe(
      true,
    );
  });

  it('should expose a prefetch window of 8 rows by default', () => {
    expect(NEAR_END_PREFETCH_ROWS).toBe(8);
  });
});
