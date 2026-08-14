import { toCanonicalQuery } from '../../search/domain/to-canonical-query';
import { QueryHistoryEntry } from './query-history-entry.model';

const DEFAULT_SUGGESTION_LIMIT = 5;

export function suggestionsFor(
  input: string,
  history: readonly QueryHistoryEntry[],
  limit: number = DEFAULT_SUGGESTION_LIMIT,
): string[] {
  const canonicalInput = toCanonicalQuery(input);
  if (!canonicalInput) {
    return [];
  }

  const inputWords = canonicalInput.split(' ');

  return history
    .filter((entry) => entry.canonicalQuery !== canonicalInput)
    .filter((entry) =>
      inputWords.every((word) => entry.words.some((entryWord) => entryWord.startsWith(word))),
    )
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit)
    .map((entry) => entry.query);
}
