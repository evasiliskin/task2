export interface SearchResult {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly width: number;
  readonly height: number;
  readonly creator: string | null;
  readonly sourceUrl: string;
}
