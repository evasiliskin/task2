import { HttpErrorResponse } from '@angular/common/http';
import { HttpFailure } from '@core/http/http-failure.model';
import { RequestTimeoutError } from '@core/http/request-timeout.model';
import { InvalidApiResponseError } from '../data-access/openverse-response.guard';
import { toSearchErrorKind } from './to-search-error-kind';

describe('toSearchErrorKind', () => {
  it('should return the failure kind, when the error is an HttpFailure', () => {
    const failure = new HttpFailure('offline', 0, new HttpErrorResponse({ status: 0 }));
    expect(toSearchErrorKind(failure)).toBe('offline');
  });

  it('should return timeout, when the error is a RequestTimeoutError', () => {
    expect(toSearchErrorKind(new RequestTimeoutError())).toBe('timeout');
  });

  it('should return invalidResponse, when the error is an InvalidApiResponseError', () => {
    expect(toSearchErrorKind(new InvalidApiResponseError('results-not-an-array'))).toBe(
      'invalidResponse',
    );
  });

  it('should return unknown, when the error is unrecognised', () => {
    expect(toSearchErrorKind(new Error('boom'))).toBe('unknown');
  });
});
