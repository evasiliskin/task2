import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { SearchFacade } from './search.facade';
import { SearchActions, SearchPageActions } from './state/search.actions';

describe('SearchFacade', () => {
  let facade: SearchFacade;
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatchSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SearchFacade,
        {
          provide: Store,
          useValue: { select: () => of(null), dispatch: dispatchSpy },
        },
      ],
    });
    facade = TestBed.inject(SearchFacade);
  });

  it('search() dispatches queryTyped with the raw query', () => {
    facade.search('cats');
    expect(dispatchSpy).toHaveBeenCalledWith(SearchPageActions.queryTyped({ query: 'cats' }));
  });

  it('loadNextPage() dispatches nextPageRequested', () => {
    facade.loadNextPage();
    expect(dispatchSpy).toHaveBeenCalledWith(SearchPageActions.nextPageRequested());
  });

  it('retry() dispatches retryRequested', () => {
    facade.retry();
    expect(dispatchSpy).toHaveBeenCalledWith(SearchActions.retryRequested());
  });
});
