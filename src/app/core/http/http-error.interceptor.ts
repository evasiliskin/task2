import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';

export interface NormalizedHttpError {
  readonly status: number;
  readonly message: string;
  readonly cause: HttpErrorResponse;
}

export const RETRYABLE_STATUSES: readonly number[] = [0, 429, 500, 502, 503, 504];
export const MAX_RETRY_ATTEMPTS = 2;
export const RETRY_BASE_DELAY_MS = 500;

function isRetryable(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && RETRYABLE_STATUSES.includes(error.status);
}

function messageFor(status: number): string {
  if (status === 0) {
    return 'Network error — check your connection and try again.';
  }
  if (status === 429) {
    return 'Too many requests — please wait a moment and try again.';
  }
  return 'The request could not be completed. Please try again.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isNormalizedHttpError(value: unknown): value is NormalizedHttpError {
  return (
    isRecord(value) &&
    typeof value['message'] === 'string' &&
    typeof value['status'] === 'number'
  );
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: MAX_RETRY_ATTEMPTS,
      delay: (error, retryCount) => {
        if (!isRetryable(error)) {
          return throwError(() => error);
        }
        return timer(RETRY_BASE_DELAY_MS * 2 ** (retryCount - 1));
      },
    }),
    catchError((error: HttpErrorResponse) => {
      const normalized: NormalizedHttpError = {
        status: error.status,
        message: messageFor(error.status),
        cause: error,
      };
      return throwError(() => normalized);
    }),
  );
