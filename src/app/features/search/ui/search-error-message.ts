import { SearchErrorKind } from '../state/to-search-error-kind';

const MESSAGES: Readonly<Record<SearchErrorKind, string>> = {
  offline: 'Network error — check your connection and try again.',
  rateLimited: 'Too many requests — please wait a moment and try again.',
  server: 'The request could not be completed. Please try again.',
  client: 'The request could not be completed. Please try again.',
  invalidResponse: 'The image service returned unexpected data. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function searchErrorMessage(kind: SearchErrorKind): string {
  return MESSAGES[kind];
}
