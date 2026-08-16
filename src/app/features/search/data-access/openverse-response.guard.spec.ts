import {
  assertSearchResponseEnvelope,
  InvalidApiResponseError,
  isImageEntry,
} from './openverse-response.guard';

const valid = {
  result_count: 1,
  page_count: 1,
  results: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Snowy mountains',
      url: 'https://example.org/images/snowy-mountains.jpg',
      thumbnail: 'https://example.org/thumbs/snowy-mountains.jpg',
      width: 1920,
      height: 1080,
      creator: null,
      foreign_landing_url: 'https://example.org/photos/snowy-mountains',
    },
  ],
};

describe('assertSearchResponseEnvelope', () => {
  it('should not throw, when the envelope is well-formed', () => {
    expect(() => assertSearchResponseEnvelope(valid)).not.toThrow();
  });

  it('should not throw, when the result set is empty', () => {
    expect(() =>
      assertSearchResponseEnvelope({ result_count: 0, page_count: 0, results: [] }),
    ).not.toThrow();
  });

  it('should throw an invalid-response error, when the body is null', () => {
    expect(() => assertSearchResponseEnvelope(null)).toThrow(InvalidApiResponseError);
  });

  it('should throw an invalid-response error, when results is not an array', () => {
    expect(() => assertSearchResponseEnvelope({ ...valid, results: 'nope' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it('should throw an invalid-response error, when page_count is not numeric', () => {
    expect(() => assertSearchResponseEnvelope({ ...valid, page_count: 'two' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it('should not throw, when a single result entry is malformed', () => {
    expect(() =>
      assertSearchResponseEnvelope({ ...valid, results: [{ ...valid.results[0], id: 7 }] }),
    ).not.toThrow();
  });

  it('should expose a machine-readable reason, when it throws', () => {
    try {
      assertSearchResponseEnvelope({ ...valid, results: 'nope' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as InvalidApiResponseError).reason).toBe('results-not-an-array');
    }
  });
});

describe('isImageEntry', () => {
  it('should return true, when the entry is a well-formed image', () => {
    expect(isImageEntry(valid.results[0])).toBe(true);
  });

  it('should return false, when the entry has no string id', () => {
    expect(isImageEntry({ ...valid.results[0], id: 7 })).toBe(false);
  });

  it('should return false, when the entry has no usable image url', () => {
    expect(isImageEntry({ ...valid.results[0], url: null })).toBe(false);
  });

  it('should return false, when the value is not an object', () => {
    expect(isImageEntry(null)).toBe(false);
  });
});
