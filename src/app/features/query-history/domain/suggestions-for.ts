import { QueryHistoryEntry } from './query-history-entry.model';

const DEFAULT_SUGGESTION_LIMIT = 5;

export function suggestionsFor(
  input: string,
  history: readonly QueryHistoryEntry[],
  limit: number = DEFAULT_SUGGESTION_LIMIT,
): string[] {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) {
    return [];
  }

  const inputWords = normalizedInput.split(/\s+/);

  return history
    .filter((entry) => entry.query.toLowerCase() !== normalizedInput)
    .filter((entry) => {
      const entryWords = entry.query.toLowerCase().split(/\s+/);
      return inputWords.every((word) => entryWords.some((entryWord) => entryWord.startsWith(word)));
    })
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit)
    .map((entry) => entry.query);
}
