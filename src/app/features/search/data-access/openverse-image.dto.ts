export interface OpenverseImageDto {
  readonly id: string;
  readonly title: string | null;
  readonly url: string;
  readonly thumbnail: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly creator: string | null;
  readonly foreign_landing_url: string;
}

export interface OpenverseSearchResponseDto {
  readonly result_count: number;
  readonly page_count: number;
  readonly results: readonly OpenverseImageDto[];
}
