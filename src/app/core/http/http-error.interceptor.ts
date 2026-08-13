import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface NormalizedHttpError {
  readonly status: number;
  readonly message: string;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const normalized: NormalizedHttpError = {
        status: error.status,
        message:
          error.status === 0
            ? 'Network error — check your connection and try again.'
            : 'The request could not be completed. Please try again.',
      };
      return throwError(() => normalized);
    }),
  );
