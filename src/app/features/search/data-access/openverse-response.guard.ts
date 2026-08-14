import { OpenverseSearchResponseDto } from './openverse-image.dto';

export class InvalidApiResponseError extends Error {
  constructor(readonly reason: string) {
    super(`The image API returned an unexpected response (${reason}).`);
    this.name = 'InvalidApiResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isImageEntry(value: unknown): boolean {
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
  if (!value['results'].every(isImageEntry)) {
    throw new InvalidApiResponseError('result-entry-malformed');
  }
}
