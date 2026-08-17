export interface PolygonRenderOptions {
  readonly strokeColor: string;
  readonly mutedStrokeColor: string;
  readonly fillColor: string;
  readonly vertexRadius: number;
  readonly handleRadius: number;
  readonly lineWidth: number;
}

export const DEFAULT_POLYGON_RENDER_OPTIONS: PolygonRenderOptions = {
  strokeColor: '#1677ff',
  mutedStrokeColor: 'rgba(22, 119, 255, 0.45)',
  fillColor: 'rgba(22, 119, 255, 0.15)',
  vertexRadius: 5,
  handleRadius: 6,
  lineWidth: 2,
};
