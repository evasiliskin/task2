import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { SearchActions, SearchPageActions } from './state/search.actions';
import { initialState, searchFeature } from './state/search.reducer';
import { SearchFacade } from './search.facade';
import { appConfig } from '@core/config/app-config';

const { debounceMs } = appConfig.search;

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
    vi.advanceTimersByTime(debounceMs);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.searchRequested({ query: 'cat' }));
  });

  it('should dispatch queryCleared, when the debounced query is not meaningful', () => {
    facade.queryChanged('c');
    vi.advanceTimersByTime(debounceMs);

    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.queryCleared());
  });

  it('should dispatch nothing, when the debounce window has not elapsed', () => {
    facade.queryChanged('cat');
    vi.advanceTimersByTime(debounceMs - 1);

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch one search, when the query changes only by casing', () => {
    facade.queryChanged('cats');
    vi.advanceTimersByTime(debounceMs);
    facade.queryChanged('Cats');
    vi.advanceTimersByTime(debounceMs);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.searchRequested({ query: 'cats' }));
  });

  it('should dispatch immediately, when a query is submitted rather than typed', () => {
    facade.querySubmitted('mountains');

    expect(store.dispatch).toHaveBeenCalledWith(
      SearchActions.searchRequested({ query: 'mountains' }),
    );
  });

  it('should not dispatch a second search, when the input echoes a submitted query', () => {
    facade.querySubmitted('mountains');
    facade.queryChanged('mountains');
    vi.advanceTimersByTime(debounceMs);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should dispatch a next-page request, when the next page is loaded', () => {
    facade.loadNextPage();

    expect(store.dispatch).toHaveBeenCalledWith(SearchPageActions.nextPageRequested());
  });

  it('should dispatch a retry request, when a retry is asked for', () => {
    facade.retry();

    expect(store.dispatch).toHaveBeenCalledWith(SearchActions.retryRequested());
  });

  it('should expose the initial view model, when the store holds the initial state', () => {
    expect(facade.viewModel()).toEqual({
      results: [],
      status: 'idle',
      error: null,
      activeQuery: null,
      hasMoreResults: false,
      isLoadingMore: false,
      isLoadingMoreError: false,
    });
  });
});
