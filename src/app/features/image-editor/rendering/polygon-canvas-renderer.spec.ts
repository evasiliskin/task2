import { CanvasBoxSize } from '../domain/geometry/coordinate-mapping.model';
import { Polygon } from '../domain/polygon.model';
import { DEFAULT_POLYGON_RENDER_OPTIONS, PolygonRenderOptions } from './polygon-render-options';
import { PolygonCanvasRenderer } from './polygon-canvas-renderer';

function createMockContext(): CanvasRenderingContext2D & { fillStyleHistory: string[] } {
  const fillStyleHistory: string[] = [];
  let fillStyleValue = '';
  const context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    fillStyleHistory,
  };

  Object.defineProperty(context, 'fillStyle', {
    get: () => fillStyleValue,
    set: (value: string) => {
      fillStyleValue = value;
      fillStyleHistory.push(value);
    },
  });

  return context as unknown as CanvasRenderingContext2D & { fillStyleHistory: string[] };
}

describe('PolygonCanvasRenderer', () => {
  const boxSize: CanvasBoxSize = { width: 100, height: 100 };
  const polygon: Polygon = {
    id: 'polygon-1',
    imageId: 'image-1',
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
  };

  it('should clear the canvas and draw nothing else, when polygon is null', () => {
    const context = createMockContext();

    new PolygonCanvasRenderer().render(context, null, boxSize);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(context.moveTo).not.toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
    expect(context.save).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalled();
  });

  it('should draw the polygon outline through each world-space vertex in pixel space, when a polygon is given', () => {
    const context = createMockContext();

    new PolygonCanvasRenderer().render(context, polygon, boxSize);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(context.moveTo).toHaveBeenCalledWith(40, 40);
    expect(context.lineTo).toHaveBeenNthCalledWith(1, 60, 40);
    expect(context.lineTo).toHaveBeenNthCalledWith(2, 60, 60);
    expect(context.lineTo).toHaveBeenNthCalledWith(3, 40, 60);
    expect(context.closePath).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.save).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalled();
  });

  it('should draw a vertex marker at each pixel-space vertex, when a polygon is given', () => {
    const context = createMockContext();

    new PolygonCanvasRenderer().render(context, polygon, boxSize, DEFAULT_POLYGON_RENDER_OPTIONS);

    expect(context.arc).toHaveBeenCalledWith(
      40,
      40,
      DEFAULT_POLYGON_RENDER_OPTIONS.vertexRadius,
      0,
      Math.PI * 2,
    );
    expect(context.arc).toHaveBeenCalledWith(
      60,
      40,
      DEFAULT_POLYGON_RENDER_OPTIONS.vertexRadius,
      0,
      Math.PI * 2,
    );
    expect(context.arc).toHaveBeenCalledWith(
      60,
      60,
      DEFAULT_POLYGON_RENDER_OPTIONS.vertexRadius,
      0,
      Math.PI * 2,
    );
    expect(context.arc).toHaveBeenCalledWith(
      40,
      60,
      DEFAULT_POLYGON_RENDER_OPTIONS.vertexRadius,
      0,
      Math.PI * 2,
    );
  });

  it('should draw the rotation handle above the centroid, when a polygon is given', () => {
    const context = createMockContext();

    new PolygonCanvasRenderer().render(context, polygon, boxSize, DEFAULT_POLYGON_RENDER_OPTIONS);

    expect(context.moveTo).toHaveBeenCalledWith(50, 50);
    expect(context.lineTo).toHaveBeenCalledWith(50, 30);
    expect(context.arc).toHaveBeenCalledWith(
      50,
      30,
      DEFAULT_POLYGON_RENDER_OPTIONS.handleRadius,
      0,
      Math.PI * 2,
    );
  });

  it('should use the provided render options, when custom options are given', () => {
    const context = createMockContext();
    const customOptions: PolygonRenderOptions = {
      strokeColor: '#ff0000',
      fillColor: 'rgba(255, 0, 0, 0.5)',
      vertexRadius: 9,
      handleRadius: 12,
      lineWidth: 4,
    };

    new PolygonCanvasRenderer().render(context, polygon, boxSize, customOptions);

    expect(context.arc).toHaveBeenCalledWith(40, 40, 9, 0, Math.PI * 2);
    expect(context.arc).toHaveBeenCalledWith(50, 30, 12, 0, Math.PI * 2);
    expect(context.strokeStyle).toBe('#ff0000');
    expect(context.lineWidth).toBe(4);
    expect(context.fillStyleHistory).toEqual([
      customOptions.fillColor,
      customOptions.strokeColor,
      customOptions.strokeColor,
    ]);
  });
});
