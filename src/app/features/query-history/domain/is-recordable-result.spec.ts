import { isRecordableResult } from './is-recordable-result';

describe('isRecordableResult', () => {
  it('should record, when the first page returned results', () => {
    expect(isRecordableResult(1, 5)).toBe(true);
  });

  it('should not record, when the page is not the first', () => {
    expect(isRecordableResult(2, 5)).toBe(false);
  });

  it('should not record, when the query returned nothing', () => {
    expect(isRecordableResult(1, 0)).toBe(false);
  });
});
