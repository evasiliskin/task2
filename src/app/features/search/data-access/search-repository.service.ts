import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { OPENVERSE_API_CONFIG } from '@core/api/openverse/openverse-api.config';
import { OpenverseApi } from './openverse-api.service';
import { MappedSearchPage, mapOpenverseSearchResponse } from './search-result.mapper';
import { SearchResultsCache } from './search-results-cache.service';

@Injectable({ providedIn: 'root' })
export class SearchRepository {
  private readonly api = inject(OpenverseApi);
  private readonly cache = inject(SearchResultsCache);
  private readonly pageSize = inject(OPENVERSE_API_CONFIG).pageSize;

  search(query: string, page: number): Observable<MappedSearchPage> {
    const cached = this.cache.get(query, page);
    if (cached) {
      return of(cached);
    }

    return this.api.searchImages(query, page, this.pageSize).pipe(
      map(mapOpenverseSearchResponse),
      tap((mapped) => this.cache.set(query, page, mapped)),
    );
  }
}
