import { appConfig } from '@core/config/app-config';

const { minScale, maxScale } = appConfig.imageEditor.polygon;

export function clampPolygonScale(scale: number): number {
  return Math.min(maxScale, Math.max(minScale, scale));
}
