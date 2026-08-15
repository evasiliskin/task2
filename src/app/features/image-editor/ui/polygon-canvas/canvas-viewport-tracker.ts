import { Signal, effect, signal } from '@angular/core';
import { CanvasBoxSize } from '../../domain/geometry/coordinate-mapping.model';

/**
 * Tracks the on-screen box size of an element (via `ResizeObserver`) and the current device
 * pixel ratio (via a `matchMedia` listener), for canvas backing-store sizing. Must be
 * constructed within an injection context (e.g. a component constructor) since it registers
 * effects.
 */
export class CanvasViewportTracker {
  private readonly boxSizeState = signal<CanvasBoxSize>({ width: 0, height: 0 });
  private readonly pixelRatioState = signal(globalThis.devicePixelRatio || 1);

  readonly boxSize: Signal<CanvasBoxSize> = this.boxSizeState.asReadonly();
  readonly pixelRatio: Signal<number> = this.pixelRatioState.asReadonly();

  constructor(element: () => HTMLElement) {
    effect((onCleanup) => {
      const observer = new ResizeObserver(([entry]) => {
        this.boxSizeState.set({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(element());
      onCleanup(() => observer.disconnect());
    });

    effect((onCleanup) => {
      const query = globalThis.matchMedia?.(`(resolution: ${this.pixelRatioState()}dppx)`);
      if (!query) {
        return;
      }
      const onChange = () => this.pixelRatioState.set(globalThis.devicePixelRatio || 1);
      query.addEventListener('change', onChange);
      onCleanup(() => query.removeEventListener('change', onChange));
    });
  }
}
