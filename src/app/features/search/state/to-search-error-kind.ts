import { HttpFailure, HttpFailureKind } from '@core/http/http-failure.model';
import { InvalidApiResponseError } from '../data-access/openverse-response.guard';

export type SearchErrorKind = HttpFailureKind | 'invalidResponse';

export function toSearchErrorKind(error: unknown): SearchErrorKind {
  if (error instanceof InvalidApiResponseError) {
    return 'invalidResponse';
  }
  if (error instanceof HttpFailure) {
    return error.kind;
  }
  return 'unknown';
}
