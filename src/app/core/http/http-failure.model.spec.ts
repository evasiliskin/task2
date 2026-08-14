import { HttpErrorResponse } from '@angular/common/http';
import { HttpFailure, httpFailureKindFor } from './http-failure.model';

describe('httpFailureKindFor', () => {
  it('should classify status 0 as offline', () => {
    expect(httpFailureKindFor(0)).toBe('offline');
  });

  it('should classify status 429 as rateLimited', () => {
    expect(httpFailureKindFor(429)).toBe('rateLimited');
  });

  it('should classify status 503 as server', () => {
    expect(httpFailureKindFor(503)).toBe('server');
  });

  it('should classify status 404 as client', () => {
    expect(httpFailureKindFor(404)).toBe('client');
  });

  it('should classify an unexpected status as unknown', () => {
    expect(httpFailureKindFor(199)).toBe('unknown');
  });
});

describe('HttpFailure', () => {
  it('should be an Error carrying its kind, status and cause', () => {
    const cause = new HttpErrorResponse({ status: 429 });
    const failure = new HttpFailure('rateLimited', 429, cause);

    expect(failure).toBeInstanceOf(Error);
    expect(failure.kind).toBe('rateLimited');
    expect(failure.status).toBe(429);
    expect(failure.cause).toBe(cause);
  });
});
