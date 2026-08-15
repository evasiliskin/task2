import { isRecordableResult } from './is-recordable-result';

describe('isRecordableResult', () => {
  it('should record the query, when the first page produced renderable results', () => {
    expect(isRecordableResult(1, 20)).toBe(true);
  });

  it('should not record the query, when the first page produced no renderable results', () => {
    expect(isRecordableResult(1, 0)).toBe(false);
  });

  it('should not record the query, when the success is for a later page', () => {
    expect(isRecordableResult(2, 20)).toBe(false);
  });
});
