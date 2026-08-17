import { appConfig } from '@core/config/app-config';

export function isMeaningfulQuery(
  normalizedQuery: string,
  minLength: number = appConfig.search.minQueryLength,
): boolean {
  if (normalizedQuery.length >= minLength) {
    return true;
  }
  const codePoint = normalizedQuery.codePointAt(0);
  return codePoint !== undefined && codePoint > 0x7f;
}
