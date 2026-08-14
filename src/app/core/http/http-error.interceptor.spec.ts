import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  httpErrorInterceptor,
  MAX_RETRY_ATTEMPTS,
  NormalizedHttpError,
} from './http-error.interceptor';

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

  it('should normalize a server error into a user-safe message, when the request returns a 500', async () => {
    vi.useFakeTimers();
    let captured: NormalizedHttpError | undefined;

    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock
        .expectOne('/test')
        .flush('Internal error', { status: 500, statusText: 'Server Error' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured?.status).toBe(500);
    expect(captured?.message).toBe('The request could not be completed. Please try again.');
    vi.useRealTimers();
  });

  it('should normalize a network error, when the request fails with status 0', async () => {
    vi.useFakeTimers();
    let captured: NormalizedHttpError | undefined;

    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock
        .expectOne('/test')
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured?.status).toBe(0);
    expect(captured?.message).toContain('Network error');
    vi.useRealTimers();
  });

  it('should retry a 429 and succeed, when a later attempt returns data', async () => {
    vi.useFakeTimers();
    let value: unknown;
    http.get('/test').subscribe({ next: (data) => (value = data) });

    httpMock.expectOne('/test').flush('rate limited', { status: 429, statusText: 'Too Many' });
    await vi.advanceTimersByTimeAsync(1000);
    httpMock.expectOne('/test').flush({ ok: true });

    expect(value).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it('should give up after the maximum attempts, when a 503 keeps failing', async () => {
    vi.useFakeTimers();
    let captured: NormalizedHttpError | undefined;
    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock.expectOne('/test').flush('down', { status: 503, statusText: 'Unavailable' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured?.status).toBe(503);
    vi.useRealTimers();
  });

  it('should not retry a 404, and should preserve the original response as the cause', () => {
    let captured: NormalizedHttpError | undefined;
    http.get('/test').subscribe({ error: (error: NormalizedHttpError) => (captured = error) });

    httpMock.expectOne('/test').flush('missing', { status: 404, statusText: 'Not Found' });

    expect(captured?.status).toBe(404);
    expect(captured?.cause).toBeInstanceOf(HttpErrorResponse);
    expect(captured?.cause.status).toBe(404);
  });
});
