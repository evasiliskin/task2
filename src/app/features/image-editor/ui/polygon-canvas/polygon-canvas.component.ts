import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CanvasBoxSize, PixelPoint } from '../../domain/geometry/coordinate-mapping.model';
import { MIN_POLYGON_POINTS } from '../../domain/geometry/create-polygon-from-points';
import { toNormalizedPoint } from '../../domain/geometry/to-normalized-point';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { Polygon } from '../../domain/polygon.model';
import {
  DragSession,
  PolygonInteractionController,
  RotateSession,
} from '../../interaction/polygon-interaction-controller';
import { PolygonCanvasRenderer } from '../../rendering/polygon-canvas-renderer';

type ActiveGesture =
  | { readonly kind: 'drag'; readonly session: DragSession }
  | { readonly kind: 'rotate'; readonly session: RotateSession };

@Component({
  selector: 'app-polygon-canvas',
  imports: [NzButtonModule],
  templateUrl: './polygon-canvas.component.html',
  styleUrl: './polygon-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonCanvas {
  readonly imageUrl = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly polygon = input<Polygon | null>(null);

  readonly polygonDrawn = output<readonly NormalizedPoint[]>();
  readonly polygonMoved = output<NormalizedPoint>();
  readonly polygonRotated = output<number>();

  protected readonly minPoints = MIN_POLYGON_POINTS;
  protected readonly drawPoints = signal<readonly NormalizedPoint[]>([]);
  protected readonly draftPolygon = signal<Polygon | null>(null);
  protected readonly displayPolygon = computed(() => this.draftPolygon() ?? this.polygon());

  private readonly boxSize = signal<CanvasBoxSize>({ width: 0, height: 0 });
  private readonly imageEl = viewChild.required<ElementRef<HTMLImageElement>>('imageEl');
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');

  private readonly controller = new PolygonInteractionController();
  private readonly renderer = new PolygonCanvasRenderer();
  private activeGesture: ActiveGesture | null = null;

  constructor() {
    effect((onCleanup) => {
      const element = this.imageEl().nativeElement;
      const observer = new ResizeObserver(([entry]) => {
        this.boxSize.set({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });

    effect(() => {
      if (this.polygon()) {
        this.drawPoints.set([]);
      }
    });

    effect(() => {
      const size = this.boxSize();
      const canvas = this.canvasEl().nativeElement;
      if (size.width === 0 || size.height === 0) {
        return;
      }
      canvas.width = size.width;
      canvas.height = size.height;

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const points = this.drawPoints();
      if (!this.polygon() && points.length > 0) {
        this.renderer.renderDrawPreview(context, points, size);
      } else {
        this.renderer.render(context, this.displayPolygon(), size);
      }
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    const boxSize = this.boxSize();
    if (boxSize.width === 0 || boxSize.height === 0) {
      return;
    }

    const pixelPointer: PixelPoint = { x: event.offsetX, y: event.offsetY };
    const currentPolygon = this.polygon();

    if (!currentPolygon) {
      if (this.controller.isNearFirstDrawPoint(this.drawPoints(), pixelPointer, boxSize)) {
        this.commitDraw();
        return;
      }
      this.drawPoints.update((points) => [...points, toNormalizedPoint(pixelPointer, boxSize)]);
      return;
    }

    if (this.controller.hitTestRotationHandle(currentPolygon, pixelPointer, boxSize)) {
      this.activeGesture = {
        kind: 'rotate',
        session: this.controller.beginRotate(currentPolygon, pixelPointer, boxSize),
      };
      this.canvasEl().nativeElement.setPointerCapture?.(event.pointerId);
      return;
    }

    if (this.controller.hitTestBody(currentPolygon, pixelPointer, boxSize)) {
      this.activeGesture = {
        kind: 'drag',
        session: this.controller.beginDrag(currentPolygon, pixelPointer),
      };
      this.canvasEl().nativeElement.setPointerCapture?.(event.pointerId);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.activeGesture) {
      return;
    }
    const pixelPointer: PixelPoint = { x: event.offsetX, y: event.offsetY };
    const boxSize = this.boxSize();

    this.draftPolygon.set(
      this.activeGesture.kind === 'drag'
        ? this.controller.updateDrag(this.activeGesture.session, pixelPointer, boxSize)
        : this.controller.updateRotate(this.activeGesture.session, pixelPointer, boxSize),
    );
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.activeGesture) {
      return;
    }
    const finalPolygon = this.draftPolygon();
    if (finalPolygon) {
      if (this.activeGesture.kind === 'drag') {
        this.polygonMoved.emit(finalPolygon.position);
      } else {
        this.polygonRotated.emit(finalPolygon.rotationRadians);
      }
    }

    this.activeGesture = null;
    this.draftPolygon.set(null);
    this.canvasEl().nativeElement.releasePointerCapture?.(event.pointerId);
  }

  protected onCanvasDoubleClick(): void {
    this.drawPoints.update((points) => points.slice(0, -1));
    this.commitDraw();
  }

  protected onFinishDraw(): void {
    this.commitDraw();
  }

  protected onCancelDraw(): void {
    this.drawPoints.set([]);
  }

  private commitDraw(): void {
    const points = this.drawPoints();
    if (points.length < MIN_POLYGON_POINTS) {
      return;
    }
    this.polygonDrawn.emit(points);
    this.drawPoints.set([]);
  }
}
