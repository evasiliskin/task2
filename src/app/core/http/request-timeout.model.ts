/** Upper bound for a single HTTP attempt. Each retry attempt is bounded independently. */
export const REQUEST_TIMEOUT_MS = 15_000;

export class RequestTimeoutError extends Error {
  constructor(readonly timeoutMs: number = REQUEST_TIMEOUT_MS) {
    super(`HTTP request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}
