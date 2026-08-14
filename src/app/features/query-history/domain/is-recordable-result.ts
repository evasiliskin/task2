export function isRecordableResult(page: number, totalCount: number): boolean {
  return page === 1 && totalCount > 0;
}
