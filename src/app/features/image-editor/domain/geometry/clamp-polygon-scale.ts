export const MIN_POLYGON_SCALE = 0.1;
export const MAX_POLYGON_SCALE = 5;

export function clampPolygonScale(scale: number): number {
  return Math.min(MAX_POLYGON_SCALE, Math.max(MIN_POLYGON_SCALE, scale));
}
