import { searchErrorMessage } from './search-error-message';

describe('searchErrorMessage', () => {
  it('should return the connection message, when the kind is offline', () => {
    expect(searchErrorMessage('offline')).toBe(
      'Network error — check your connection and try again.',
    );
  });

  it('should return the wait-and-retry message, when the kind is rateLimited', () => {
    expect(searchErrorMessage('rateLimited')).toBe(
      'Too many requests — please wait a moment and try again.',
    );
  });

  it('should return the generic retry message, when the kind is server', () => {
    expect(searchErrorMessage('server')).toBe(
      'The request could not be completed. Please try again.',
    );
  });

  it('should return the generic retry message, when the kind is client', () => {
    expect(searchErrorMessage('client')).toBe(
      'The request could not be completed. Please try again.',
    );
  });

  it('should return the unexpected-data message, when the kind is invalidResponse', () => {
    expect(searchErrorMessage('invalidResponse')).toBe(
      'The image service returned unexpected data. Please try again.',
    );
  });

  it('should return the took-too-long message, when the kind is timeout', () => {
    expect(searchErrorMessage('timeout')).toBe(
      'The image service took too long to respond. Please try again.',
    );
  });

  it('should return the fallback message, when the kind is unknown', () => {
    expect(searchErrorMessage('unknown')).toBe('Something went wrong. Please try again.');
  });
});
