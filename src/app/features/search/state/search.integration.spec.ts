import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore, Store } from '@ngrx/store';
import { firstValueFrom, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { OpenverseApi } from '../data-access/openverse-api.service';
import { SearchResultsCache } from '../data-access/search-results-cache.service';
import { SearchActions, SearchPageActions } from './search.actions';
import { SearchEffects } from './search.effects';
import { searchFeature, selectPage, selectStatus } from './search.reducer';

describe('search state integration (real store + real reducer + real effects)', () => {
  it('loads the next page once the first page has succeeded', async () => {
    const searchImages = vi.fn((query: string, page: number) =>
      of({
        result_count: 4,
        page_count: 2,
        results: [
          {
            id: `${query}-${page}`,
            title: 'Title',
            url: 'u',
            thumbnail: 't',
            width: 1,
            height: 1,
            creator: null,
            foreign_landing_url: 'f',
          },
        ],
      }),
    );
    const cache = { get: vi.fn(() => undefined), set: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideStore(),
        provideState(searchFeature),
        provideEffects(SearchEffects),
        { provide: OpenverseApi, useValue: { searchImages } },
        { provide: SearchResultsCache, useValue: cache },
      ],
    });

    const store = TestBed.inject(Store);

    store.dispatch(SearchActions.searchRequested({ query: 'cats' }));
    await firstValueFrom(
      store.select(selectStatus).pipe(
        filter((status) => status === 'success'),
        take(1),
      ),
    );

    store.dispatch(SearchPageActions.nextPageRequested());
    await firstValueFrom(
      store.select(selectPage).pipe(
        filter((page) => page === 2),
        take(1),
      ),
    );

    expect(searchImages).toHaveBeenCalledTimes(2);
    expect(searchImages).toHaveBeenNthCalledWith(2, 'cats', 2, expect.any(Number));
    expect(await firstValueFrom(store.select(selectStatus).pipe(take(1)))).toBe('success');
  });
});
