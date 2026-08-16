import { HttpErrorResponse } from '@angular/common/http';
import { HttpFailure, httpFailureKindFor } from './http-failure.model';

describe('httpFailureKindFor', () => {
  it('should return offline, when the status is 0', () => {
    expect(httpFailureKindFor(0)).toBe('offline');
  });

  it('should return rateLimited, when the status is 429', () => {
    expect(httpFailureKindFor(429)).toBe('rateLimited');
  });

  it('should return server, when the status is in the 5xx range', () => {
    expect(httpFailureKindFor(503)).toBe('server');
  });

  it('should return client, when the status is in the 4xx range', () => {
    expect(httpFailureKindFor(404)).toBe('client');
  });

  it('should return unknown, when the status is outside the known ranges', () => {
    expect(httpFailureKindFor(199)).toBe('unknown');
  });
});

describe('HttpFailure', () => {
  it('should expose its kind, status and cause as an Error, when it is constructed', () => {
    const cause = new HttpErrorResponse({ status: 429 });
    const failure = new HttpFailure('rateLimited', 429, cause);

    expect(failure).toBeInstanceOf(Error);
    expect(failure.kind).toBe('rateLimited');
    expect(failure.status).toBe(429);
    expect(failure.cause).toBe(cause);
  });
});
