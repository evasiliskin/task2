import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { isMeaningfulQuery, normalizeSearchQuery, toCanonicalQuery } from '@shared/search-query';
import { SEARCH_DEBOUNCE_MS } from './domain/search-debounce';
import { SearchActions, SearchPageActions } from './state/search.actions';
import { selectSearchViewModel } from './state/search.reducer';

@Injectable({ providedIn: 'root' })
export class SearchFacade {
  private readonly store = inject(Store);
  private readonly queryInput$ = new Subject<string>();

  readonly viewModel = toSignal(this.store.select(selectSearchViewModel), { requireSync: true });

  constructor() {
    this.queryInput$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        map(normalizeSearchQuery),
        distinctUntilChanged(
          (previous, current) => toCanonicalQuery(previous) === toCanonicalQuery(current),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((query) => {
        this.store.dispatch(
          isMeaningfulQuery(query)
            ? SearchActions.searchRequested({ query })
            : SearchActions.queryCleared(),
        );
      });
  }

  queryChanged(query: string): void {
    this.queryInput$.next(query);
  }

  loadNextPage(): void {
    this.store.dispatch(SearchPageActions.nextPageRequested());
  }

  retry(): void {
    this.store.dispatch(SearchActions.retryRequested());
  }
}
