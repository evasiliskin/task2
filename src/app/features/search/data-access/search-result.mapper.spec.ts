import { mapOpenverseImageToSearchResult, mapOpenverseSearchResponse } from './search-result.mapper';
import { OpenverseImageDto, OpenverseSearchResponseDto } from './openverse-image.dto';

describe('mapOpenverseImageToSearchResult', () => {
  const baseDto: OpenverseImageDto = {
    id: 'abc-123',
    title: '  Sunset over the hills  ',
    url: 'https://example.com/full.jpg',
    thumbnail: 'https://example.com/thumb.jpg',
    width: 1024,
    height: 768,
    creator: 'Jane Doe',
    foreign_landing_url: 'https://example.com/source',
  };

  it('maps and trims all known DTO fields to the domain model', () => {
    expect(mapOpenverseImageToSearchResult(baseDto)).toEqual({
      id: 'abc-123',
      title: 'Sunset over the hills',
      imageUrl: 'https://example.com/full.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      width: 1024,
      height: 768,
      creator: 'Jane Doe',
      sourceUrl: 'https://example.com/source',
    });
  });

  it('falls back to "Untitled" when title is null or blank', () => {
    expect(mapOpenverseImageToSearchResult({ ...baseDto, title: null }).title).toBe('Untitled');
    expect(mapOpenverseImageToSearchResult({ ...baseDto, title: '   ' }).title).toBe('Untitled');
  });

  it('defaults missing width/height to 0', () => {
    const result = mapOpenverseImageToSearchResult({ ...baseDto, width: null, height: null });
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });
});

describe('mapOpenverseSearchResponse', () => {
  it('maps result_count/page_count and every result item', () => {
    const dto: OpenverseSearchResponseDto = {
      result_count: 240,
      page_count: 12,
      results: [
        {
          id: '1',
          title: 'One',
          url: 'https://example.com/1.jpg',
          thumbnail: 'https://example.com/1-thumb.jpg',
          width: 100,
          height: 100,
          creator: null,
          foreign_landing_url: 'https://example.com/1',
        },
      ],
    };

    const mapped = mapOpenverseSearchResponse(dto);

    expect(mapped.totalCount).toBe(240);
    expect(mapped.pageCount).toBe(12);
    expect(mapped.results).toHaveLength(1);
    expect(mapped.results[0].id).toBe('1');
  });
});
