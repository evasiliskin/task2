import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';
import { HttpFailure, httpFailureKindFor } from './http-failure.model';

export const RETRYABLE_STATUSES: readonly number[] = [0, 429, 500, 502, 503, 504];
export const IDEMPOTENT_METHODS: readonly string[] = ['GET', 'HEAD'];
export const MAX_RETRY_ATTEMPTS = 2;
export const RETRY_BASE_DELAY_MS = 500;

function isRetryable(request: HttpRequest<unknown>, error: unknown): boolean {
  return (
    IDEMPOTENT_METHODS.includes(request.method) &&
    error instanceof HttpErrorResponse &&
    RETRYABLE_STATUSES.includes(error.status)
  );
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: MAX_RETRY_ATTEMPTS,
      delay: (error: unknown, retryCount: number) => {
        if (!isRetryable(req, error)) {
          return throwError(() => error);
        }
        return timer(RETRY_BASE_DELAY_MS * 2 ** (retryCount - 1));
      },
    }),
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof HttpErrorResponse
          ? new HttpFailure(httpFailureKindFor(error.status), error.status, error)
          : error,
      ),
    ),
  );
