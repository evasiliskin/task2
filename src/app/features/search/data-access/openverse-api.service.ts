import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OPENVERSE_API_CONFIG } from '@core/api/openverse/openverse-api.config';

@Injectable({ providedIn: 'root' })
export class OpenverseApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(OPENVERSE_API_CONFIG);

  searchImages(query: string, page: number, pageSize: number): Observable<unknown> {
    const params = new HttpParams().set('q', query).set('page', page).set('page_size', pageSize);
    return this.http.get(`${this.config.baseUrl}/images/`, { params });
  }
}
