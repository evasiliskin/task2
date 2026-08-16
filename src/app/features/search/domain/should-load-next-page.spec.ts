import { shouldLoadNextPage } from './should-load-next-page';

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

  it('should trigger, when a tall viewport reaches the end of the loaded rows', () => {
    expect(
      shouldLoadNextPage({ ...base, firstVisibleIndex: 88, visibleRowCount: 12, loadedCount: 100 }),
    ).toBe(true);
  });

  it('should trigger, when a short viewport reaches the end of the loaded rows', () => {
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

  it('should trigger, when the whole loaded list fits in the viewport and more pages exist', () => {
    expect(
      shouldLoadNextPage({ ...base, firstVisibleIndex: 0, visibleRowCount: 12, loadedCount: 5 }),
    ).toBe(true);
  });

  it('should trigger, when a wider prefetch window is passed explicitly', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 80, visibleRowCount: 8 }, 20)).toBe(
      true,
    );
  });

  it('should not trigger, when the same position falls outside the default prefetch window', () => {
    expect(shouldLoadNextPage({ ...base, firstVisibleIndex: 80, visibleRowCount: 8 })).toBe(false);
  });

  it('should trigger, when no rows are loaded yet and more pages exist', () => {
    expect(shouldLoadNextPage({ ...base, loadedCount: 0, visibleRowCount: 0 })).toBe(true);
  });
});
