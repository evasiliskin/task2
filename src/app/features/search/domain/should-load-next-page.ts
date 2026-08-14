export const SEARCH_RESULT_ROW_HEIGHT_PX = 96;
export const NEAR_END_PREFETCH_ROWS = 8;

export interface NextPageTriggerState {
  readonly firstVisibleIndex: number;
  readonly visibleRowCount: number;
  readonly loadedCount: number;
  readonly hasMoreResults: boolean;
  readonly isLoadingMore: boolean;
  readonly isLoadingMoreError: boolean;
}

export function shouldLoadNextPage(
  state: NextPageTriggerState,
  prefetchRows: number = NEAR_END_PREFETCH_ROWS,
): boolean {
  if (!state.hasMoreResults || state.isLoadingMore || state.isLoadingMoreError) {
    return false;
  }
  const lastVisibleIndex = state.firstVisibleIndex + state.visibleRowCount;
  return state.loadedCount - lastVisibleIndex <= prefetchRows;
}
