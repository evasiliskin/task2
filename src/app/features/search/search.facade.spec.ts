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

  it('should dispatch queryTyped with the raw query, when search() is called', () => {
    facade.search('cats');
    expect(dispatchSpy).toHaveBeenCalledWith(SearchPageActions.queryTyped({ query: 'cats' }));
  });

  it('should dispatch nextPageRequested, when loadNextPage() is called', () => {
    facade.loadNextPage();
    expect(dispatchSpy).toHaveBeenCalledWith(SearchPageActions.nextPageRequested());
  });

  it('should dispatch retryRequested, when retry() is called', () => {
    facade.retry();
    expect(dispatchSpy).toHaveBeenCalledWith(SearchActions.retryRequested());
  });
});
