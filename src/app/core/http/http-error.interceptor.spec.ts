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
  RETRY_BASE_DELAY_MS,
} from './http-error.interceptor';
import { HttpFailure } from './http-failure.model';
import { REQUEST_TIMEOUT_MS, RequestTimeoutError } from './request-timeout.model';

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

  it('should normalize a server error into an HttpFailure, when the request returns a 500', async () => {
    vi.useFakeTimers();
    let captured: HttpFailure | undefined;

    http.get('/test').subscribe({ error: (error: HttpFailure) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock
        .expectOne('/test')
        .flush('Internal error', { status: 500, statusText: 'Server Error' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured).toBeInstanceOf(HttpFailure);
    expect(captured?.status).toBe(500);
    expect(captured?.kind).toBe('server');
    vi.useRealTimers();
  });

  it('should normalize a network error, when the request fails with status 0', async () => {
    vi.useFakeTimers();
    let captured: HttpFailure | undefined;

    http.get('/test').subscribe({ error: (error: HttpFailure) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock
        .expectOne('/test')
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured).toBeInstanceOf(HttpFailure);
    expect(captured?.status).toBe(0);
    expect(captured?.kind).toBe('offline');
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
    let captured: HttpFailure | undefined;
    http.get('/test').subscribe({ error: (error: HttpFailure) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock.expectOne('/test').flush('down', { status: 503, statusText: 'Unavailable' });
      await vi.advanceTimersByTimeAsync(5000);
    }

    expect(captured).toBeInstanceOf(HttpFailure);
    expect(captured?.status).toBe(503);
    vi.useRealTimers();
  });

  it('should fail immediately with the original response as cause, when the request returns a 404', () => {
    let captured: HttpFailure | undefined;
    http.get('/test').subscribe({ error: (error: HttpFailure) => (captured = error) });

    httpMock.expectOne('/test').flush('missing', { status: 404, statusText: 'Not Found' });

    expect(captured).toBeInstanceOf(HttpFailure);
    expect(captured?.status).toBe(404);
    expect(captured?.kind).toBe('client');
    expect(captured?.cause).toBeInstanceOf(HttpErrorResponse);
    expect(captured?.cause.status).toBe(404);
  });

  it('should fail with a RequestTimeoutError, when the response never arrives', async () => {
    vi.useFakeTimers();
    let captured: unknown;
    http.get('/test').subscribe({ error: (error: unknown) => (captured = error) });

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      httpMock.expectOne('/test');
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      await vi.advanceTimersByTimeAsync(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }

    expect(captured).toBeInstanceOf(RequestTimeoutError);
    vi.useRealTimers();
  });

  it('should not retry, when the failing request is a POST', () => {
    const httpClient = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    let caught: unknown;

    httpClient.post('/anything', {}).subscribe({ error: (error: unknown) => (caught = error) });
    controller.expectOne('/anything').flush(null, { status: 503, statusText: 'Unavailable' });

    controller.verify();
    expect(caught).toBeInstanceOf(HttpFailure);
  });
});
