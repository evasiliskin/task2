import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SEARCH_RESULTS_PAGE_SIZE } from '@core/api/openverse/openverse-api.config';
import { OpenverseApi } from './openverse-api.service';
import { MappedSearchPage, mapOpenverseSearchResponse } from './search-result.mapper';
import { SearchResultsCache } from './search-results-cache.service';

@Injectable({ providedIn: 'root' })
export class SearchRepository {
  private readonly api = inject(OpenverseApi);
  private readonly cache = inject(SearchResultsCache);

  search(query: string, page: number): Observable<MappedSearchPage> {
    const cached = this.cache.get(query, page);
    if (cached) {
      return of(cached);
    }

    return this.api.searchImages(query, page, SEARCH_RESULTS_PAGE_SIZE).pipe(
      map(mapOpenverseSearchResponse),
      tap((mapped) => this.cache.set(query, page, mapped)),
    );
  }
}
