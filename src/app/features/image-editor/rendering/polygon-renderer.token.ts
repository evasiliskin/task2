import { InjectionToken } from '@angular/core';
import { PolygonCanvasRenderer } from './polygon-canvas-renderer';

export const POLYGON_CANVAS_RENDERER = new InjectionToken<PolygonCanvasRenderer>(
  'POLYGON_CANVAS_RENDERER',
  { providedIn: 'root', factory: () => new PolygonCanvasRenderer() },
);
