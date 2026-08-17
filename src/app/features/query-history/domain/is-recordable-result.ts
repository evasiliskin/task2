export function isRecordableResult(page: number, renderableResultCount: number): boolean {
  return page === 1 && renderableResultCount > 0;
}
