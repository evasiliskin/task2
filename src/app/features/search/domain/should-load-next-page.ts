import { appConfig } from '@core/config/app-config';

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
  prefetchRows: number = appConfig.search.results.nearEndPrefetchRows,
): boolean {
  if (!state.hasMoreResults || state.isLoadingMore || state.isLoadingMoreError) {
    return false;
  }
  const lastVisibleIndex = state.firstVisibleIndex + state.visibleRowCount;
  return state.loadedCount - lastVisibleIndex <= prefetchRows;
}
