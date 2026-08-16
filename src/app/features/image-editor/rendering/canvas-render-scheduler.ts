import { Signal, signal } from '@angular/core';
import { PolygonCanvasRenderer } from './polygon-canvas-renderer';
import { RenderFrame } from './render-frame.model';

export class CanvasRenderScheduler {
  private readonly contextUnavailableState = signal(false);
  private context: CanvasRenderingContext2D | null = null;
  private contextResolved = false;
  private pendingFrame: RenderFrame | null = null;
  private frameHandle: number | null = null;

  readonly contextUnavailable: Signal<boolean> = this.contextUnavailableState.asReadonly();

  constructor(private readonly renderer: PolygonCanvasRenderer) {}

  schedule(canvas: HTMLCanvasElement, frame: RenderFrame): void {
    this.pendingFrame = frame;
    if (this.frameHandle !== null) {
      return;
    }
    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = null;
      const nextFrame = this.pendingFrame;
      this.pendingFrame = null;
      if (nextFrame) {
        this.draw(canvas, nextFrame);
      }
    });
  }

  destroy(): void {
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  private draw(canvas: HTMLCanvasElement, frame: RenderFrame): void {
    const backingWidth = Math.round(frame.size.width * frame.pixelRatio);
    const backingHeight = Math.round(frame.size.height * frame.pixelRatio);

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }

    const context = this.resolveContext(canvas);
    if (!context) {
      return;
    }

    context.setTransform(frame.pixelRatio, 0, 0, frame.pixelRatio, 0, 0);

    if (frame.mode === 'drawing') {
      this.renderer.render(context, frame.polygons, null, frame.size);
      this.renderer.renderDrawPreview(context, frame.drawPoints, frame.size);
    } else {
      this.renderer.render(context, frame.polygons, frame.selectedId, frame.size);
    }
  }

  private resolveContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if (!this.contextResolved) {
      this.context = canvas.getContext('2d');
      this.contextResolved = true;
      this.contextUnavailableState.set(this.context === null);
    }
    return this.context;
  }
}
