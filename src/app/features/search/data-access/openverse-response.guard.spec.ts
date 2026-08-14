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

describe('assertSearchResponseEnvelope', () => {
  it('should accept a well-formed response', () => {
    expect(() => assertSearchResponseEnvelope(valid)).not.toThrow();
  });

  it('should accept an empty result set', () => {
    expect(() =>
      assertSearchResponseEnvelope({ result_count: 0, page_count: 0, results: [] }),
    ).not.toThrow();
  });

  it('should reject a null body', () => {
    expect(() => assertSearchResponseEnvelope(null)).toThrow(InvalidApiResponseError);
  });

  it('should reject a body whose results are not an array', () => {
    expect(() => assertSearchResponseEnvelope({ ...valid, results: 'nope' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it('should reject a body with a non-numeric page_count', () => {
    expect(() => assertSearchResponseEnvelope({ ...valid, page_count: 'two' })).toThrow(
      InvalidApiResponseError,
    );
  });

  it("should not reject a malformed result entry, since per-entry validation is not the envelope guard's job", () => {
    expect(() =>
      assertSearchResponseEnvelope({ ...valid, results: [{ ...valid.results[0], id: 7 }] }),
    ).not.toThrow();
  });

  it('should carry a machine-readable reason', () => {
    try {
      assertSearchResponseEnvelope({ ...valid, results: 'nope' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as InvalidApiResponseError).reason).toBe('results-not-an-array');
    }
  });
});

describe('isImageEntry', () => {
  it('should accept a well-formed image entry', () => {
    expect(isImageEntry(valid.results[0])).toBe(true);
  });

  it('should reject an entry without a string id', () => {
    expect(isImageEntry({ ...valid.results[0], id: 7 })).toBe(false);
  });

  it('should reject an entry without a usable image url', () => {
    expect(isImageEntry({ ...valid.results[0], url: null })).toBe(false);
  });

  it('should reject a non-object value', () => {
    expect(isImageEntry(null)).toBe(false);
  });
});
