import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor, NormalizedHttpError } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes a server error into a user-safe message', () => {
    let captured: NormalizedHttpError | undefined;

    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    httpMock
      .expectOne('/test')
      .flush('Internal error', { status: 500, statusText: 'Server Error' });

    expect(captured).toEqual({
      status: 500,
      message: 'The request could not be completed. Please try again.',
    });
  });

  it('normalizes a network error (status 0)', () => {
    let captured: NormalizedHttpError | undefined;

    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    httpMock
      .expectOne('/test')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(captured?.status).toBe(0);
    expect(captured?.message).toContain('Network error');
  });
});
