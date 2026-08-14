import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { fromEvent, merge } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { CanvasBoxSize, PixelPoint } from '../../domain/geometry/coordinate-mapping.model';
import { MIN_POLYGON_POINTS } from '../../domain/geometry/create-polygon-from-points';
import { toNormalizedPoint } from '../../domain/geometry/to-normalized-point';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { Polygon } from '../../domain/polygon.model';
import {
  DragSession,
  KEYBOARD_NUDGE_STEP,
  KEYBOARD_ROTATION_STEP_RADIANS,
  RotateSession,
} from '../../interaction/polygon-interaction-controller';
import { POLYGON_INTERACTION_CONTROLLER } from '../../interaction/polygon-interaction.token';
import { POLYGON_CANVAS_RENDERER } from '../../rendering/polygon-renderer.token';

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
const EMPTY_DRAW_POINTS: readonly NormalizedPoint[] = [];

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
  readonly imageWidth = input(0);
  readonly imageHeight = input(0);
  readonly polygon = input<Polygon | null>(null);

  readonly polygonDrawn = output<readonly NormalizedPoint[]>();
  readonly polygonMoved = output<NormalizedPoint>();
  readonly polygonRotated = output<number>();
  readonly polygonDeleted = output<void>();

  protected readonly minPoints = MIN_POLYGON_POINTS;
  protected readonly drawPoints = linkedSignal<Polygon | null, readonly NormalizedPoint[]>({
    source: this.polygon,
    computation: (polygon, previous) =>
      polygon ? EMPTY_DRAW_POINTS : (previous?.value ?? EMPTY_DRAW_POINTS),
  });
  protected readonly draftPolygon = signal<Polygon | null>(null);
  protected readonly displayPolygon = computed(() => this.draftPolygon() ?? this.polygon());
  protected readonly canvasUnavailable = signal(false);
  protected readonly imageStatus = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly drawAriaLabel = 'Polygon editor. Click the image to start drawing a polygon.';
  protected readonly editorAriaLabel =
    'Polygon editor. Use arrow keys to move, [ and ] to rotate, Delete to remove.';

  private readonly boxSize = signal<CanvasBoxSize>({ width: 0, height: 0 });
  private readonly imageEl = viewChild.required<ElementRef<HTMLImageElement>>('imageEl');
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');

  private readonly controller = inject(POLYGON_INTERACTION_CONTROLLER);
  private readonly renderer = inject(POLYGON_CANVAS_RENDERER);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
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
    if (this.imageStatus() === 'error') {
      return;
    }

    const boxSize = this.boxSize();
    if (boxSize.width === 0 || boxSize.height === 0) {
      return;
    }

    if (this.activeGesture) {
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
      this.startGesture(event, {
        kind: 'rotate',
        session: this.controller.beginRotate(currentPolygon, pixelPointer, boxSize),
      });
      return;
    }

    if (this.controller.hitTestBody(currentPolygon, pixelPointer, boxSize)) {
      this.startGesture(event, {
        kind: 'drag',
        session: this.controller.beginDrag(currentPolygon, pixelPointer),
      });
    }
  }

  private startGesture(event: PointerEvent, gesture: ActiveGesture): void {
    const canvas = this.canvasEl().nativeElement;
    this.activeGesture = gesture;
    canvas.setPointerCapture?.(event.pointerId);

    const gestureEnd$ = merge(
      fromEvent<PointerEvent>(canvas, 'pointerup'),
      fromEvent<PointerEvent>(canvas, 'pointercancel'),
    ).pipe(take(1));

    fromEvent<PointerEvent>(canvas, 'pointermove')
      .pipe(takeUntil(gestureEnd$), takeUntilDestroyed(this.destroyRef))
      .subscribe((moveEvent) => this.updateGesture(moveEvent));

    gestureEnd$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((endEvent) => this.endGesture(endEvent));
  }

  private updateGesture(event: PointerEvent): void {
    const activeGesture = this.activeGesture;
    if (!activeGesture) {
      return;
    }

    const boxSize = this.boxSize();
    if (boxSize.width <= 0 || boxSize.height <= 0) {
      this.abortGesture(event);
      return;
    }

    const pixelPointer: PixelPoint = { x: event.offsetX, y: event.offsetY };
    this.draftPolygon.set(
      activeGesture.kind === 'drag'
        ? this.controller.updateDrag(activeGesture.session, pixelPointer, boxSize)
        : this.controller.updateRotate(activeGesture.session, pixelPointer, boxSize),
    );
  }

  private endGesture(event: PointerEvent): void {
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

    this.abortGesture(event);
  }

  private abortGesture(event: PointerEvent): void {
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

  protected onImageLoad(): void {
    this.imageStatus.set('loaded');
  }

  protected onImageError(): void {
    this.imageStatus.set('error');
  }

  protected onDeletePolygon(): void {
    this.announce('Polygon deleted.');
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
    this.announce(`Polygon moved ${direction}.`);
    this.polygonMoved.emit(this.controller.nextPosition(polygon, delta));
  }

  private commitRotate(polygon: Polygon, deltaRadians: number, direction: string): void {
    this.announce(`Polygon rotated ${KEYBOARD_ROTATION_STEP_DEGREES}° ${direction}.`);
    this.polygonRotated.emit(this.controller.nextRotation(polygon, deltaRadians));
  }

  private announce(message: string): void {
    void this.liveAnnouncer.announce(message);
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
