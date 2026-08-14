import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OpenverseApi } from './openverse-api.service';
import { OPENVERSE_API_CONFIG } from '@core/api/openverse/openverse-api.config';
import { OpenverseSearchResponseDto } from './openverse-image.dto';

describe('OpenverseApi', () => {
  let api: OpenverseApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OPENVERSE_API_CONFIG, useValue: { baseUrl: 'https://api.test/v1' } },
      ],
    });
    api = TestBed.inject(OpenverseApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the images endpoint with q, page and page_size params, when searching images', () => {
    const response: OpenverseSearchResponseDto = { result_count: 0, page_count: 0, results: [] };

    api.searchImages('cats', 2, 20).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'https://api.test/v1/images/' &&
        r.params.get('q') === 'cats' &&
        r.params.get('page') === '2' &&
        r.params.get('page_size') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
