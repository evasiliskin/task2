import { searchErrorMessage } from './search-error-message';

describe('searchErrorMessage', () => {
  it('should preserve the offline copy', () => {
    expect(searchErrorMessage('offline')).toBe(
      'Network error — check your connection and try again.',
    );
  });

  it('should preserve the rate-limited copy', () => {
    expect(searchErrorMessage('rateLimited')).toBe(
      'Too many requests — please wait a moment and try again.',
    );
  });

  it('should preserve the server copy', () => {
    expect(searchErrorMessage('server')).toBe(
      'The request could not be completed. Please try again.',
    );
  });

  it('should preserve the client copy', () => {
    expect(searchErrorMessage('client')).toBe(
      'The request could not be completed. Please try again.',
    );
  });

  it('should preserve the invalid-response copy', () => {
    expect(searchErrorMessage('invalidResponse')).toBe(
      'The image service returned unexpected data. Please try again.',
    );
  });

  it('should preserve the fallback copy', () => {
    expect(searchErrorMessage('unknown')).toBe('Something went wrong. Please try again.');
  });
});
