import { appConfig } from '@core/config/app-config';
import { RequestTimeoutError } from './request-timeout.model';

const { requestTimeoutMs } = appConfig.http;

describe('RequestTimeoutError', () => {
  it('should be an Error carrying its name and message, when constructed with the default timeout', () => {
    const error = new RequestTimeoutError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RequestTimeoutError');
    expect(error.timeoutMs).toBe(requestTimeoutMs);
    expect(error.message).toBe(`HTTP request timed out after ${requestTimeoutMs}ms`);
  });

  it('should carry a custom timeout, when constructed with an explicit value', () => {
    const error = new RequestTimeoutError(5000);

    expect(error.timeoutMs).toBe(5000);
    expect(error.message).toBe('HTTP request timed out after 5000ms');
  });
});
