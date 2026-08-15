import { CanvasRenderScheduler } from './canvas-render-scheduler';
import { RenderFrame } from './render-frame.model';

function aFrame(overrides: Partial<RenderFrame> = {}): RenderFrame {
  return {
    size: { width: 200, height: 100 },
    drawPoints: [],
    mode: 'idle',
    polygons: [],
    selectedId: null,
    pixelRatio: 2,
    ...overrides,
  };
}

describe('CanvasRenderScheduler', () => {
  it('should paint only the latest frame, when several frames are scheduled before the next animation frame', async () => {
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const renderer = { render: vi.fn(), renderDrawPreview: vi.fn() };
    const scheduler = new CanvasRenderScheduler(renderer as never);

    scheduler.schedule(canvas, aFrame());
    scheduler.schedule(canvas, aFrame({ selectedId: 'p2' }));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(context, [], 'p2', { width: 200, height: 100 });
  });

  it('should size the backing store to the device pixel ratio, when a frame is painted', async () => {
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const scheduler = new CanvasRenderScheduler({
      render: vi.fn(),
      renderDrawPreview: vi.fn(),
    } as never);

    scheduler.schedule(canvas, aFrame());
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
  });

  it('should report the context as unavailable, when the canvas provides no 2D context', async () => {
    const canvas = { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
    const scheduler = new CanvasRenderScheduler({
      render: vi.fn(),
      renderDrawPreview: vi.fn(),
    } as never);

    scheduler.schedule(canvas, aFrame());
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(scheduler.contextUnavailable()).toBe(true);
  });
});
