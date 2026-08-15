import { CanvasBoxSize } from '../domain/geometry/coordinate-mapping.model';
import { Polygon } from '../domain/polygon.model';
import { DEFAULT_POLYGON_RENDER_OPTIONS, PolygonRenderOptions } from './polygon-render-options';
import { PolygonCanvasRenderer } from './polygon-canvas-renderer';

type FakeContext = CanvasRenderingContext2D & {
  calls: string[];
  strokeStyles: string[];
  fillStyleHistory: string[];
};

function createFakeContext(): FakeContext {
  const calls: string[] = [];
  const strokeStyles: string[] = [];
  const fillStyleHistory: string[] = [];
  let strokeStyleValue = '';
  let fillStyleValue = '';

  const context = {
    clearRect: vi.fn(() => calls.push('clearRect')),
    beginPath: vi.fn(() => calls.push('beginPath')),
    closePath: vi.fn(() => calls.push('closePath')),
    moveTo: vi.fn(() => calls.push('moveTo')),
    lineTo: vi.fn(() => calls.push('lineTo')),
    arc: vi.fn(() => calls.push('arc')),
    rect: vi.fn(() => calls.push('rect')),
    fill: vi.fn(() => calls.push('fill')),
    stroke: vi.fn(() => calls.push('stroke')),
    save: vi.fn(() => calls.push('save')),
    restore: vi.fn(() => calls.push('restore')),
    lineWidth: 0,
    calls,
    strokeStyles,
    fillStyleHistory,
  };

  Object.defineProperty(context, 'strokeStyle', {
    get: () => strokeStyleValue,
    set: (value: string) => {
      strokeStyleValue = value;
      strokeStyles.push(value);
    },
  });

  Object.defineProperty(context, 'fillStyle', {
    get: () => fillStyleValue,
    set: (value: string) => {
      fillStyleValue = value;
      fillStyleHistory.push(value);
    },
  });

  return context as unknown as FakeContext;
}

const BOX: CanvasBoxSize = { width: 100, height: 100 };

function polygon(id: string): Polygon {
  return {
    id,
    imageId: 'image-1',
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
    scale: 1,
    createdAt: 0,
  };
}

describe('PolygonCanvasRenderer', () => {
  it('should clear the canvas and draw nothing else, when there are no polygons', () => {
    const context = createFakeContext();

    new PolygonCanvasRenderer().render(context, [], null, BOX);

    expect(context.calls).toContain('clearRect');
    expect(context.calls).not.toContain('fill');
  });

  it('should draw the polygon outline through each world-space vertex in pixel space, when the selected polygon is given', () => {
    const context = createFakeContext();

    new PolygonCanvasRenderer().render(context, [polygon('p1')], 'p1', BOX);

    expect(context.calls).toContain('clearRect');
    expect(context.calls).toContain('moveTo');
    expect(context.calls).toContain('lineTo');
    expect(context.calls).toContain('closePath');
    expect(context.calls).toContain('fill');
    expect(context.calls).toContain('stroke');
  });

  it('should draw a vertex marker at each pixel-space vertex, when the selected polygon is given', () => {
    const context = createFakeContext();

    new PolygonCanvasRenderer().render(
      context,
      [polygon('p1')],
      'p1',
      BOX,
      DEFAULT_POLYGON_RENDER_OPTIONS,
    );

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

  it('should draw the rotation handle above the centroid, when the selected polygon is given', () => {
    const context = createFakeContext();

    new PolygonCanvasRenderer().render(
      context,
      [polygon('p1')],
      'p1',
      BOX,
      DEFAULT_POLYGON_RENDER_OPTIONS,
    );

    expect(context.moveTo).toHaveBeenCalledWith(50, 50);
    expect(context.lineTo).toHaveBeenCalledWith(50, 12);
    expect(context.arc).toHaveBeenCalledWith(
      50,
      12,
      DEFAULT_POLYGON_RENDER_OPTIONS.handleRadius,
      0,
      Math.PI * 2,
    );
  });

  it('should draw a scale handle at each bounding-box corner, when the selected polygon is given', () => {
    const context = createFakeContext();

    new PolygonCanvasRenderer().render(
      context,
      [polygon('p1')],
      'p1',
      BOX,
      DEFAULT_POLYGON_RENDER_OPTIONS,
    );

    expect(context.rect).toHaveBeenCalledTimes(4);
  });

  it('should use the provided render options, when custom options are given', () => {
    const context = createFakeContext();
    const customOptions: PolygonRenderOptions = {
      strokeColor: '#ff0000',
      mutedStrokeColor: 'rgba(255, 0, 0, 0.3)',
      fillColor: 'rgba(255, 0, 0, 0.5)',
      vertexRadius: 9,
      handleRadius: 12,
      lineWidth: 4,
    };

    new PolygonCanvasRenderer().render(context, [polygon('p1')], 'p1', BOX, customOptions);

    expect(context.arc).toHaveBeenCalledWith(40, 40, 9, 0, Math.PI * 2);
    expect(context.arc).toHaveBeenCalledWith(50, 12, 12, 0, Math.PI * 2);
    expect(context.strokeStyle).toBe('#ff0000');
    expect(context.lineWidth).toBe(4);
  });

  it('should stroke once per polygon plus the selected polygon handles, when three polygons are rendered', () => {
    const context = createFakeContext();
    const renderer = new PolygonCanvasRenderer();

    renderer.render(context, [polygon('p1'), polygon('p2'), polygon('p3')], 'p2', BOX);

    expect(context.calls.filter((call) => call === 'stroke').length).toBeGreaterThanOrEqual(4);
  });

  it('should use the muted stroke colour, when a polygon is not the selected one', () => {
    const context = createFakeContext();
    const renderer = new PolygonCanvasRenderer();

    renderer.render(context, [polygon('p1')], null, BOX);

    expect(context.strokeStyles).toContain(DEFAULT_POLYGON_RENDER_OPTIONS.mutedStrokeColor);
  });

  it('should draw only the unselected polygons, when no polygon is selected', () => {
    const context = createFakeContext();
    const renderer = new PolygonCanvasRenderer();

    renderer.render(context, [polygon('p1'), polygon('p2')], null, BOX);

    expect(context.calls).not.toContain('arc');
    expect(context.calls).not.toContain('rect');
  });

  describe('renderDrawPreview', () => {
    it('should draw nothing and not clear the canvas, when there are no points', () => {
      const context = createFakeContext();

      new PolygonCanvasRenderer().renderDrawPreview(context, [], BOX);

      expect(context.calls).not.toContain('clearRect');
      expect(context.calls).not.toContain('moveTo');
      expect(context.calls).not.toContain('arc');
    });

    it('should draw an open polyline through each pixel-space point without closing it, when points are given', () => {
      const context = createFakeContext();
      const points = [
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.4 },
        { x: 0.5, y: 0.6 },
      ];

      new PolygonCanvasRenderer().renderDrawPreview(context, points, BOX);

      expect(context.moveTo).toHaveBeenCalledWith(40, 40);
      expect(context.lineTo).toHaveBeenNthCalledWith(1, 60, 40);
      expect(context.lineTo).toHaveBeenNthCalledWith(2, 50, 60);
      expect(context.calls).not.toContain('closePath');
      expect(context.calls).toContain('stroke');
    });

    it('should draw a vertex marker at each placed point, when points are given', () => {
      const context = createFakeContext();
      const points = [{ x: 0.4, y: 0.4 }];

      new PolygonCanvasRenderer().renderDrawPreview(
        context,
        points,
        BOX,
        DEFAULT_POLYGON_RENDER_OPTIONS,
      );

      expect(context.arc).toHaveBeenCalledWith(
        40,
        40,
        DEFAULT_POLYGON_RENDER_OPTIONS.vertexRadius,
        0,
        Math.PI * 2,
      );
    });
  });
});
