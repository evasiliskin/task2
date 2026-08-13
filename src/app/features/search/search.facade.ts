import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { SearchPageActions, SearchActions } from './state/search.actions';
import {
  selectSearchResults,
  selectStatus,
  selectError,
  selectActiveQuery,
  selectHasMoreResults,
  selectIsLoadingMore,
  selectIsLoadingMoreError,
} from './state/search.reducer';

@Injectable({ providedIn: 'root' })
export class SearchFacade {
  private readonly store = inject(Store);

  readonly results$ = this.store.select(selectSearchResults);
  readonly status$ = this.store.select(selectStatus);
  readonly error$ = this.store.select(selectError);
  readonly activeQuery$ = this.store.select(selectActiveQuery);
  readonly hasMoreResults$ = this.store.select(selectHasMoreResults);
  readonly isLoadingMore$ = this.store.select(selectIsLoadingMore);
  readonly isLoadingMoreError$ = this.store.select(selectIsLoadingMoreError);

  search(query: string): void {
    this.store.dispatch(SearchPageActions.queryTyped({ query }));
  }

  loadNextPage(): void {
    this.store.dispatch(SearchPageActions.nextPageRequested());
  }

  retry(): void {
    this.store.dispatch(SearchActions.retryRequested());
  }
}
