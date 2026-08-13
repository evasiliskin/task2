import '@angular/compiler';
import { SearchPageActions, SearchActions, SearchApiActions } from './search.actions';

describe('search actions', () => {
  it('creates a Query Typed action carrying the raw query', () => {
    const action = SearchPageActions.queryTyped({ query: 'cats' });
    expect(action.type).toBe('[Search Page] Query Typed');
    expect(action.query).toBe('cats');
  });

  it('creates a Search Requested action', () => {
    const action = SearchActions.searchRequested({ query: 'cats' });
    expect(action.type).toBe('[Search] Search Requested');
    expect(action.query).toBe('cats');
  });

  it('creates a Load Results Success action carrying the full page payload', () => {
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
