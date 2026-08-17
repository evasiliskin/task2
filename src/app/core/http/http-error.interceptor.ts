import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';
import { APP_CONFIG } from '@core/config/app-config.token';
import { HttpConfig } from '@core/config/app-config.schema';
import { HttpFailure, httpFailureKindFor } from './http-failure.model';
import { RequestTimeoutError } from './request-timeout.model';

function isRetryable(config: HttpConfig, request: HttpRequest<unknown>, error: unknown): boolean {
  if (!config.idempotentMethods.includes(request.method)) {
    return false;
  }
  if (error instanceof RequestTimeoutError) {
    return true;
  }
  return error instanceof HttpErrorResponse && config.retryableStatuses.includes(error.status);
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(APP_CONFIG).http;

  return next(req).pipe(
    timeout({
      each: config.requestTimeoutMs,
      with: () => throwError(() => new RequestTimeoutError(config.requestTimeoutMs)),
    }),
    retry({
      count: config.maxRetryAttempts,
      delay: (error: unknown, retryCount: number) => {
        if (!isRetryable(config, req, error)) {
          return throwError(() => error);
        }
        return timer(config.retryBaseDelayMs * 2 ** (retryCount - 1));
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
};
