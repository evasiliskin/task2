import { CanvasBoxSize } from '../domain/geometry/coordinate-mapping.model';
import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';

export interface RenderFrame {
  readonly size: CanvasBoxSize;
  readonly drawPoints: readonly NormalizedPoint[];
  readonly mode: 'idle' | 'drawing';
  readonly polygons: readonly Polygon[];
  readonly selectedId: string | null;
  readonly pixelRatio: number;
}
