import { assertOpenverseSearchResponse, InvalidApiResponseError } from './openverse-response.guard';

const valid = {
  result_count: 1,
  page_count: 1,
  results: [
    {
      id: 'a',
      title: 'A',
      url: 'u',
      thumbnail: 't',
      width: 1,
      height: 1,
      creator: null,
      foreign_landing_url: 'f',
    },
  ],
};

describe('assertOpenverseSearchResponse', () => {
  it('should accept a well-formed response', () => {
    expect(() => assertOpenverseSearchResponse(valid)).not.toThrow();
  });

  it('should accept an empty result set', () => {
    expect(() =>
      assertOpenverseSearchResponse({ result_count: 0, page_count: 0, results: [] }),
    ).not.toThrow();
  });

  it('should reject a null body', () => {
    expect(() => assertOpenverseSearchResponse(null)).toThrow(InvalidApiResponseError);
  });

  it('should reject a body whose results are not an array', () => {
    expect(() => assertOpenverseSearchResponse({ ...valid, results: 'nope' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it('should reject a body with a non-numeric page_count', () => {
    expect(() => assertOpenverseSearchResponse({ ...valid, page_count: 'two' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it('should reject a result entry without a string id', () => {
    expect(() =>
      assertOpenverseSearchResponse({ ...valid, results: [{ ...valid.results[0], id: 7 }] }),
    ).toThrow(InvalidApiResponseError);
  });

  it('should reject a result entry without a usable image url', () => {
    expect(() =>
      assertOpenverseSearchResponse({ ...valid, results: [{ ...valid.results[0], url: null }] }),
    ).toThrow(InvalidApiResponseError);
  });

  it('should carry a machine-readable reason', () => {
    try {
      assertOpenverseSearchResponse({ ...valid, results: 'nope' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as InvalidApiResponseError).reason).toBe('results-not-an-array');
    }
  });
});
