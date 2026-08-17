import { HttpErrorResponse } from '@angular/common/http';

export type HttpFailureKind = 'offline' | 'rateLimited' | 'server' | 'client' | 'unknown';

export function httpFailureKindFor(status: number): HttpFailureKind {
  if (status === 0) {
    return 'offline';
  }
  if (status === 429) {
    return 'rateLimited';
  }
  if (status >= 500) {
    return 'server';
  }
  if (status >= 400) {
    return 'client';
  }
  return 'unknown';
}

export class HttpFailure extends Error {
  constructor(
    readonly kind: HttpFailureKind,
    readonly status: number,
    override readonly cause: HttpErrorResponse,
  ) {
    super(`HTTP request failed (${kind}, status ${status})`);
    this.name = 'HttpFailure';
  }
}
