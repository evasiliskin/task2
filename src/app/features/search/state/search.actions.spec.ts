import { SearchPageActions, SearchActions, SearchApiActions } from './search.actions';

describe('search actions', () => {
  it('should create a Next Page Requested action, when nextPageRequested is dispatched', () => {
    const action = SearchPageActions.nextPageRequested();
    expect(action.type).toBe('[Search Page] Next Page Requested');
  });

  it('should create a Search Requested action, when searchRequested is dispatched', () => {
    const action = SearchActions.searchRequested({ query: 'cats' });
    expect(action.type).toBe('[Search] Search Requested');
    expect(action.query).toBe('cats');
  });

  it('should create a Load Results Success action carrying the full page payload, when loadResultsSuccess is dispatched', () => {
    const action = SearchApiActions.loadResultsSuccess({
      query: 'cats',
      page: 1,
      results: [],
      totalCount: 0,
      pageCount: 0,
    });
    expect(action.type).toBe('[Search API] Load Results Success');
    expect(action.page).toBe(1);
  });
});
