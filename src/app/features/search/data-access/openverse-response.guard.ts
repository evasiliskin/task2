import { OpenverseImageDto, OpenverseSearchResponseDto } from './openverse-image.dto';

export class InvalidApiResponseError extends Error {
  constructor(readonly reason: string) {
    super(`The image API returned an unexpected response (${reason}).`);
    this.name = 'InvalidApiResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isImageEntry(value: unknown): value is OpenverseImageDto {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value['id'] === 'string' &&
    typeof value['url'] === 'string' &&
    typeof value['thumbnail'] === 'string' &&
    typeof value['foreign_landing_url'] === 'string'
  );
}

/**
 * Validates only the response envelope. Individual malformed entries within
 * `results` are not rejected here — Openverse doesn't guarantee every field
 * on every entry, so callers filter entries with `isImageEntry` instead of
 * failing the whole page over one bad item.
 */
export function assertOpenverseSearchResponse(
  value: unknown,
): asserts value is OpenverseSearchResponseDto {
  if (!isRecord(value)) {
    throw new InvalidApiResponseError('body-not-an-object');
  }
  if (!Array.isArray(value['results'])) {
    throw new InvalidApiResponseError('results-not-an-array');
  }
  if (typeof value['result_count'] !== 'number' || !Number.isFinite(value['result_count'])) {
    throw new InvalidApiResponseError('result-count-not-a-number');
  }
  if (typeof value['page_count'] !== 'number' || !Number.isFinite(value['page_count'])) {
    throw new InvalidApiResponseError('page-count-not-a-number');
  }
}
