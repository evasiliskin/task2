import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { SearchPageActions, SearchActions } from './state/search.actions';
import { selectSearchViewModel } from './state/search.reducer';

@Injectable({ providedIn: 'root' })
export class SearchFacade {
  private readonly store = inject(Store);

  readonly viewModel$ = this.store.select(selectSearchViewModel);

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
