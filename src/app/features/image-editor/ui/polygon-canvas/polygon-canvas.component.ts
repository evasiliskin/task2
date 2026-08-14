import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
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
  KEYBOARD_NUDGE_STEP,
  KEYBOARD_ROTATION_STEP_RADIANS,
  PolygonInteractionController,
  RotateSession,
} from '../../interaction/polygon-interaction-controller';
import { PolygonCanvasRenderer } from '../../rendering/polygon-canvas-renderer';

type ActiveGesture =
  | { readonly kind: 'drag'; readonly session: DragSession }
  | { readonly kind: 'rotate'; readonly session: RotateSession };

interface RenderFrame {
  readonly size: CanvasBoxSize;
  readonly drawPoints: readonly NormalizedPoint[];
  readonly polygon: Polygon | null;
  readonly displayPolygon: Polygon | null;
}

const KEYBOARD_ROTATION_STEP_DEGREES = Math.round((KEYBOARD_ROTATION_STEP_RADIANS * 180) / Math.PI);

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
  readonly polygonDeleted = output<void>();

  protected readonly minPoints = MIN_POLYGON_POINTS;
  protected readonly drawPoints = signal<readonly NormalizedPoint[]>([]);
  protected readonly draftPolygon = signal<Polygon | null>(null);
  protected readonly displayPolygon = computed(() => this.draftPolygon() ?? this.polygon());
  protected readonly editStatus = signal('');
  protected readonly canvasUnavailable = signal(false);
  protected readonly editorAriaLabel =
    'Polygon editor. Use arrow keys to move, [ and ] to rotate, Delete to remove.';

  private readonly boxSize = signal<CanvasBoxSize>({ width: 0, height: 0 });
  private readonly imageEl = viewChild.required<ElementRef<HTMLImageElement>>('imageEl');
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');

  private readonly controller = new PolygonInteractionController();
  private readonly renderer = new PolygonCanvasRenderer();
  private activeGesture: ActiveGesture | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private context: CanvasRenderingContext2D | null = null;
  private contextResolved = false;
  private pendingFrame: RenderFrame | null = null;
  private frameHandle: number | null = null;

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
      if (size.width <= 0 || size.height <= 0) {
        return;
      }
      this.scheduleRender({
        size,
        drawPoints: this.drawPoints(),
        polygon: this.polygon(),
        displayPolygon: this.displayPolygon(),
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.frameHandle !== null) {
        cancelAnimationFrame(this.frameHandle);
        this.frameHandle = null;
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

  protected onDeletePolygon(): void {
    this.editStatus.set('Polygon deleted.');
    this.polygonDeleted.emit();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const currentPolygon = this.polygon();
    if (!currentPolygon) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.commitNudge(currentPolygon, { x: 0, y: -KEYBOARD_NUDGE_STEP }, 'up');
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.commitNudge(currentPolygon, { x: 0, y: KEYBOARD_NUDGE_STEP }, 'down');
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.commitNudge(currentPolygon, { x: -KEYBOARD_NUDGE_STEP, y: 0 }, 'left');
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.commitNudge(currentPolygon, { x: KEYBOARD_NUDGE_STEP, y: 0 }, 'right');
        return;
      case '[':
        event.preventDefault();
        this.commitRotate(currentPolygon, -KEYBOARD_ROTATION_STEP_RADIANS, 'counterclockwise');
        return;
      case ']':
        event.preventDefault();
        this.commitRotate(currentPolygon, KEYBOARD_ROTATION_STEP_RADIANS, 'clockwise');
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.onDeletePolygon();
        return;
      default:
        return;
    }
  }

  private commitNudge(polygon: Polygon, delta: NormalizedPoint, direction: string): void {
    const updated = this.controller.nudge(polygon, delta);
    this.editStatus.set(`Polygon moved ${direction}.`);
    this.polygonMoved.emit(updated.position);
  }

  private commitRotate(polygon: Polygon, deltaRadians: number, direction: string): void {
    const updated = this.controller.rotateByStep(polygon, deltaRadians);
    this.editStatus.set(`Polygon rotated ${KEYBOARD_ROTATION_STEP_DEGREES}° ${direction}.`);
    this.polygonRotated.emit(updated.rotationRadians);
  }

  private commitDraw(): void {
    const points = this.drawPoints();
    if (points.length < MIN_POLYGON_POINTS) {
      return;
    }
    this.polygonDrawn.emit(points);
    this.drawPoints.set([]);
  }

  private scheduleRender(frame: RenderFrame): void {
    this.pendingFrame = frame;
    if (this.frameHandle !== null) {
      return;
    }
    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = null;
      const nextFrame = this.pendingFrame;
      this.pendingFrame = null;
      if (nextFrame) {
        this.draw(nextFrame);
      }
    });
  }

  private draw(frame: RenderFrame): void {
    const canvas = this.canvasEl().nativeElement;
    const pixelRatio = globalThis.devicePixelRatio || 1;
    const backingWidth = Math.round(frame.size.width * pixelRatio);
    const backingHeight = Math.round(frame.size.height * pixelRatio);

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }

    const context = this.resolveContext(canvas);
    if (!context) {
      return;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (!frame.polygon && frame.drawPoints.length > 0) {
      this.renderer.renderDrawPreview(context, frame.drawPoints, frame.size);
    } else {
      this.renderer.render(context, frame.displayPolygon, frame.size);
    }
  }

  private resolveContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if (!this.contextResolved) {
      this.context = canvas.getContext('2d');
      this.contextResolved = true;
      this.canvasUnavailable.set(this.context === null);
    }
    return this.context;
  }
}
