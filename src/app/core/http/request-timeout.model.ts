import { appConfig } from '@core/config/app-config';

export class RequestTimeoutError extends Error {
  constructor(readonly timeoutMs: number = appConfig.http.requestTimeoutMs) {
    super(`HTTP request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}
