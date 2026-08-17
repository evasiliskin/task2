import { TestBed } from '@angular/core/testing';
import { PolygonCanvasRenderer } from './polygon-canvas-renderer';
import { POLYGON_CANVAS_RENDERER } from './polygon-renderer.token';

describe('POLYGON_CANVAS_RENDERER', () => {
  it('should resolve a PolygonCanvasRenderer, when no override is provided', () => {
    expect(TestBed.inject(POLYGON_CANVAS_RENDERER)).toBeInstanceOf(PolygonCanvasRenderer);
  });

  it('should resolve the override, when a test replaces the renderer', () => {
    const replacement = new PolygonCanvasRenderer();
    TestBed.configureTestingModule({
      providers: [{ provide: POLYGON_CANVAS_RENDERER, useValue: replacement }],
    });

    expect(TestBed.inject(POLYGON_CANVAS_RENDERER)).toBe(replacement);
  });
});
