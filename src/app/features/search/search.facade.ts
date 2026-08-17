import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { APP_CONFIG } from '@core/config/app-config.token';
import { isMeaningfulQuery, normalizeSearchQuery, toCanonicalQuery } from '@shared/search-query';
import { SearchActions, SearchPageActions } from './state/search.actions';
import { selectSearchViewModel } from './state/search.reducer';

@Injectable({ providedIn: 'root' })
export class SearchFacade {
  private readonly store = inject(Store);
  private readonly config = inject(APP_CONFIG).search;
  private readonly queryInput$ = new Subject<string>();
  private readonly querySubmitted$ = new Subject<string>();

  readonly viewModel = toSignal(this.store.select(selectSearchViewModel), { requireSync: true });

  constructor() {
    merge(this.queryInput$.pipe(debounceTime(this.config.debounceMs)), this.querySubmitted$)
      .pipe(
        map(normalizeSearchQuery),
        distinctUntilChanged(
          (previous, current) => toCanonicalQuery(previous) === toCanonicalQuery(current),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((query) => {
        this.store.dispatch(
          isMeaningfulQuery(query, this.config.minQueryLength)
            ? SearchActions.searchRequested({ query })
            : SearchActions.queryCleared(),
        );
      });
  }

  queryChanged(query: string): void {
    this.queryInput$.next(query);
  }

  querySubmitted(query: string): void {
    this.querySubmitted$.next(query);
  }

  loadNextPage(): void {
    this.store.dispatch(SearchPageActions.nextPageRequested());
  }

  retry(): void {
    this.store.dispatch(SearchActions.retryRequested());
  }
}
