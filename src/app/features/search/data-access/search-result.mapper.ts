import { SearchResult } from '../domain/search-result.model';
import { OpenverseImageDto } from './openverse-image.dto';
import { assertOpenverseSearchResponse, isImageEntry } from './openverse-response.guard';

export interface MappedSearchPage {
  readonly results: SearchResult[];
  readonly totalCount: number;
  readonly pageCount: number;
}

export function mapOpenverseImageToSearchResult(dto: OpenverseImageDto): SearchResult {
  return {
    id: dto.id,
    title: dto.title?.trim() || 'Untitled',
    imageUrl: dto.url,
    thumbnailUrl: dto.thumbnail,
    width: dto.width ?? 0,
    height: dto.height ?? 0,
    creator: dto.creator,
    sourceUrl: dto.foreign_landing_url,
  };
}

export function mapOpenverseSearchResponse(dto: unknown): MappedSearchPage {
  assertOpenverseSearchResponse(dto);
  return {
    results: dto.results.filter(isImageEntry).map(mapOpenverseImageToSearchResult),
    totalCount: dto.result_count,
    pageCount: dto.page_count,
  };
}
