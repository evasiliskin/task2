import { appConfig } from '@core/config/app-config';
import { toCanonicalQuery } from '@shared/search-query';
import { QueryHistoryEntry } from './query-history-entry.model';

export function suggestionsFor(
  input: string,
  history: readonly QueryHistoryEntry[],
  limit: number = appConfig.queryHistory.suggestionLimit,
): string[] {
  const canonicalInput = toCanonicalQuery(input);
  const byRecency = [...history].sort((a, b) => b.lastUsedAt - a.lastUsedAt);

  if (!canonicalInput) {
    return byRecency.slice(0, limit).map((entry) => entry.query);
  }

  const inputWords = canonicalInput.split(' ');

  return byRecency
    .filter((entry) => entry.canonicalQuery !== canonicalInput)
    .filter((entry) =>
      inputWords.every((word) => entry.words.some((entryWord) => entryWord.startsWith(word))),
    )
    .slice(0, limit)
    .map((entry) => entry.query);
}
