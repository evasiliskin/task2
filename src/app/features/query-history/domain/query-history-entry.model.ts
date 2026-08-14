export interface QueryHistoryEntry {
  readonly query: string;
  readonly canonicalQuery: string;
  readonly words: readonly string[];
  readonly lastUsedAt: number;
}
