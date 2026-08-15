import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { SearchActions } from './state/search.actions';
import { initialState, searchFeature } from './state/search.reducer';
import { SearchFacade } from './search.facade';
import { SEARCH_DEBOUNCE_MS } from './domain/search-debounce';

describe('SearchFacade', () => {
  let store: MockStore;
  let facade: SearchFacade;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: { [searchFeature.name]: initialState } }),
      ],
    });
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
    facade = TestBed.inject(SearchFacade);
  });

  afterEach(() => vi.useRealTimers());

  it('should dispatch one search, when several keystrokes arrive inside the debounce window', () => {
    facade.queryChanged('c');
    facade.queryChanged('ca');
    facade.queryChanged('cat');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.searchRequested({ query: 'cat' }));
  });

  it('should dispatch queryCleared, when the debounced query is not meaningful', () => {
    facade.queryChanged('c');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.queryCleared());
  });

  it('should dispatch nothing, when the debounce window has not elapsed', () => {
    facade.queryChanged('cat');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch one search, when the query changes only by casing', () => {
    facade.queryChanged('cats');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    facade.queryChanged('Cats');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.searchRequested({ query: 'cats' }));
  });
});
