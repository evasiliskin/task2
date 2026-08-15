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
  KEYBOARD_SCALE_STEP,
  RotateSession,
  ScaleSession,
} from '../../interaction/polygon-interaction-controller';
import { POLYGON_INTERACTION_CONTROLLER } from '../../interaction/polygon-interaction.token';
import { POLYGON_CANVAS_RENDERER } from '../../rendering/polygon-renderer.token';

type ActiveGesture =
  | { readonly kind: 'drag'; readonly session: DragSession }
  | { readonly kind: 'rotate'; readonly session: RotateSession }
  | { readonly kind: 'scale'; readonly session: ScaleSession };

interface RenderFrame {
  readonly size: CanvasBoxSize;
  readonly drawPoints: readonly NormalizedPoint[];
  readonly mode: 'idle' | 'drawing';
  readonly polygons: readonly Polygon[];
  readonly selectedId: string | null;
  readonly pixelRatio: number;
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
  readonly polygons = input.required<readonly Polygon[]>();
  readonly selectedPolygon = input<Polygon | null>(null);
  readonly isAtCapacity = input(false);

  readonly polygonDrawn = output<readonly NormalizedPoint[]>();
  readonly polygonMoved = output<{ polygonId: string; position: NormalizedPoint }>();
  readonly polygonRotated = output<{ polygonId: string; rotationRadians: number }>();
  readonly polygonScaled = output<{ polygonId: string; scale: number }>();
  readonly polygonDeleted = output<string>();
  readonly polygonSelected = output<string | null>();

  protected readonly minPoints = MIN_POLYGON_POINTS;
  protected readonly mode = signal<'idle' | 'drawing'>('idle');
  protected readonly canDraw = computed(() => this.imageStatus() === 'loaded');
  protected readonly selectedIndex = computed(() => {
    const selected = this.selectedPolygon();
    return selected ? this.polygons().findIndex((polygon) => polygon.id === selected.id) : -1;
  });
  protected readonly drawPoints = linkedSignal<'idle' | 'drawing', readonly NormalizedPoint[]>({
    source: this.mode,
    computation: (mode, previous) =>
      mode === 'drawing' ? (previous?.value ?? EMPTY_DRAW_POINTS) : EMPTY_DRAW_POINTS,
  });
  protected readonly draftPolygon = signal<Polygon | null>(null);
  protected readonly displayPolygons = computed(() => {
    const draft = this.draftPolygon();
    const polygons = this.polygons();
    return draft
      ? polygons.map((polygon) => (polygon.id === draft.id ? draft : polygon))
      : polygons;
  });
  protected readonly canvasUnavailable = signal(false);
  protected readonly imageStatus = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly canvasAriaLabel = computed(() => {
    if (this.mode() === 'drawing') {
      return 'Polygon editor, drawing. Click the image to place points.';
    }
    const count = this.polygons().length;
    const selected = this.selectedPolygon();
    if (count === 0) {
      return 'Polygon editor. Use the Draw polygon button to start.';
    }
    return selected
      ? `Polygon editor. ${count} polygon(s), polygon ${this.selectedIndex() + 1} selected. Arrow keys move, [ and ] rotate, plus and minus scale, Delete removes.`
      : `Polygon editor. ${count} polygon(s), none selected. Click a polygon to select it.`;
  });

  private readonly boxSize = signal<CanvasBoxSize>({ width: 0, height: 0 });
  private readonly pixelRatio = signal(globalThis.devicePixelRatio || 1);
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

    effect((onCleanup) => {
      const query = globalThis.matchMedia?.(`(resolution: ${this.pixelRatio()}dppx)`);
      if (!query) {
        return;
      }
      const onChange = () => this.pixelRatio.set(globalThis.devicePixelRatio || 1);
      query.addEventListener('change', onChange);
      onCleanup(() => query.removeEventListener('change', onChange));
    });

    effect(() => {
      const size = this.boxSize();
      if (size.width <= 0 || size.height <= 0) {
        return;
      }
      this.scheduleRender({
        size,
        drawPoints: this.drawPoints(),
        mode: this.mode(),
        polygons: this.displayPolygons(),
        selectedId: this.selectedPolygon()?.id ?? null,
        pixelRatio: this.pixelRatio(),
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
    if (this.imageStatus() !== 'loaded' || boxSize.width === 0 || boxSize.height === 0) {
      return;
    }
    if (this.activeGesture) {
      return;
    }

    const pixelPointer: PixelPoint = { x: event.offsetX, y: event.offsetY };

    if (this.mode() === 'drawing') {
      if (this.controller.isNearFirstDrawPoint(this.drawPoints(), pixelPointer, boxSize)) {
        this.commitDraw();
        return;
      }
      this.drawPoints.update((points) => [...points, toNormalizedPoint(pixelPointer, boxSize)]);
      return;
    }

    const selected = this.selectedPolygon();

    if (selected) {
      const handleIndex = this.controller.hitTestScaleHandle(selected, pixelPointer, boxSize);
      if (handleIndex !== null) {
        this.startGesture(event, {
          kind: 'scale',
          session: this.controller.beginScale(selected, handleIndex, boxSize),
        });
        return;
      }

      if (this.controller.hitTestRotationHandle(selected, pixelPointer, boxSize)) {
        this.startGesture(event, {
          kind: 'rotate',
          session: this.controller.beginRotate(selected, pixelPointer, boxSize),
        });
        return;
      }
    }

    const hit = this.controller.hitTestTopmostBody(
      this.polygons(),
      pixelPointer,
      boxSize,
      selected,
    );

    if (!hit) {
      if (selected) {
        this.polygonSelected.emit(null);
      }
      return;
    }

    if (!selected || hit.id !== selected.id) {
      this.polygonSelected.emit(hit.id);
      return;
    }

    this.startGesture(event, {
      kind: 'drag',
      session: this.controller.beginDrag(hit, pixelPointer),
    });
  }

  private startGesture(event: PointerEvent, gesture: ActiveGesture): void {
    const canvas = this.canvasEl().nativeElement;
    this.activeGesture = gesture;
    canvas.setPointerCapture?.(event.pointerId);

    const gestureEnd$ = merge(
      fromEvent<PointerEvent>(canvas, 'pointerup'),
      fromEvent<PointerEvent>(canvas, 'pointercancel'),
      fromEvent<PointerEvent>(canvas, 'lostpointercapture'),
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
        : activeGesture.kind === 'rotate'
          ? this.controller.updateRotate(activeGesture.session, pixelPointer, boxSize)
          : this.controller.updateScale(activeGesture.session, pixelPointer, boxSize),
    );
  }

  private endGesture(event: PointerEvent): void {
    const activeGesture = this.activeGesture;
    if (!activeGesture) {
      return;
    }

    const finalPolygon = this.draftPolygon();
    if (finalPolygon && event.type === 'pointerup') {
      if (activeGesture.kind === 'drag') {
        this.polygonMoved.emit({
          polygonId: finalPolygon.id,
          position: finalPolygon.position,
        });
      } else if (activeGesture.kind === 'rotate') {
        this.polygonRotated.emit({
          polygonId: finalPolygon.id,
          rotationRadians: finalPolygon.rotationRadians,
        });
      } else {
        this.polygonScaled.emit({ polygonId: finalPolygon.id, scale: finalPolygon.scale });
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
    if (this.mode() !== 'drawing') {
      return;
    }
    this.drawPoints.update((points) => points.slice(0, -1));
    this.commitDraw();
  }

  protected onStartDraw(): void {
    this.mode.set('drawing');
  }

  protected onFinishDraw(): void {
    this.commitDraw();
  }

  protected onCancelDraw(): void {
    this.mode.set('idle');
  }

  protected onImageLoad(): void {
    this.imageStatus.set('loaded');
  }

  protected onImageError(): void {
    this.imageStatus.set('error');
  }

  protected onDeletePolygon(polygonId: string): void {
    this.announce('Polygon deleted.');
    this.polygonDeleted.emit(polygonId);
  }

  protected onSelectPrevious(): void {
    this.selectByOffset(-1);
  }

  protected onSelectNext(): void {
    this.selectByOffset(1);
  }

  private selectByOffset(offset: number): void {
    const polygons = this.polygons();
    if (polygons.length === 0) {
      return;
    }
    const currentIndex = this.selectedIndex();
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + offset + polygons.length) % polygons.length;
    this.polygonSelected.emit(polygons[nextIndex].id);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const selected = this.selectedPolygon();
    if (!selected) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.commitNudge(selected, { x: 0, y: -KEYBOARD_NUDGE_STEP }, 'up');
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.commitNudge(selected, { x: 0, y: KEYBOARD_NUDGE_STEP }, 'down');
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.commitNudge(selected, { x: -KEYBOARD_NUDGE_STEP, y: 0 }, 'left');
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.commitNudge(selected, { x: KEYBOARD_NUDGE_STEP, y: 0 }, 'right');
        return;
      case '[':
        event.preventDefault();
        this.commitRotate(selected, -KEYBOARD_ROTATION_STEP_RADIANS, 'counterclockwise');
        return;
      case ']':
        event.preventDefault();
        this.commitRotate(selected, KEYBOARD_ROTATION_STEP_RADIANS, 'clockwise');
        return;
      case '+':
      case '=':
        event.preventDefault();
        this.commitScale(selected, KEYBOARD_SCALE_STEP);
        return;
      case '-':
        event.preventDefault();
        this.commitScale(selected, 1 / KEYBOARD_SCALE_STEP);
        return;
      case 'Escape':
        event.preventDefault();
        this.polygonSelected.emit(null);
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.onDeletePolygon(selected.id);
        return;
      default:
        return;
    }
  }

  private commitNudge(polygon: Polygon, delta: NormalizedPoint, direction: string): void {
    this.announce(`Polygon moved ${direction}.`);
    this.polygonMoved.emit({
      polygonId: polygon.id,
      position: this.controller.nextPosition(polygon, delta),
    });
  }

  private commitRotate(polygon: Polygon, deltaRadians: number, direction: string): void {
    this.announce(`Polygon rotated ${KEYBOARD_ROTATION_STEP_DEGREES}° ${direction}.`);
    this.polygonRotated.emit({
      polygonId: polygon.id,
      rotationRadians: this.controller.nextRotation(polygon, deltaRadians),
    });
  }

  private commitScale(polygon: Polygon, factor: number): void {
    const scale = this.controller.nextScale(polygon, factor);
    this.announce(`Polygon scaled to ${Math.round(scale * 100)} percent.`);
    this.polygonScaled.emit({ polygonId: polygon.id, scale });
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
    this.mode.set('idle');
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
    const pixelRatio = frame.pixelRatio;
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
      this.canvasUnavailable.set(this.context === null);
    }
    return this.context;
  }
}
