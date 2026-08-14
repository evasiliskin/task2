import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { SearchResult } from '../domain/search-result.model';
import { SearchErrorKind } from './to-search-error-kind';

export const SearchPageActions = createActionGroup({
  source: 'Search Page',
  events: {
    'Next Page Requested': emptyProps(),
  },
});

export const SearchActions = createActionGroup({
  source: 'Search',
  events: {
    'Search Requested': props<{ query: string }>(),
    'Query Cleared': emptyProps(),
    'Retry Requested': emptyProps(),
  },
});

export const SearchApiActions = createActionGroup({
  source: 'Search API',
  events: {
    'Load Results Success': props<{
      query: string;
      page: number;
      results: SearchResult[];
      totalCount: number;
      pageCount: number;
    }>(),
    'Load Results Failure': props<{ query: string; page: number; kind: SearchErrorKind }>(),
  },
});
