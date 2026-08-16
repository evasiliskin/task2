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
import { map, share, take, takeUntil } from 'rxjs/operators';
import { PixelPoint } from '../../domain/geometry/coordinate-mapping.model';
import { MIN_POLYGON_POINTS } from '../../domain/geometry/create-polygon-from-points';
import { toNormalizedPoint } from '../../domain/geometry/to-normalized-point';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { Polygon } from '../../domain/polygon.model';
import {
  DragSession,
  KEYBOARD_ROTATION_STEP_RADIANS,
  RotateSession,
  ScaleSession,
} from '../../interaction/polygon-interaction-controller';
import { POLYGON_INTERACTION_CONTROLLER } from '../../interaction/polygon-interaction.token';
import { CanvasRenderScheduler } from '../../rendering/canvas-render-scheduler';
import { POLYGON_CANVAS_RENDERER } from '../../rendering/polygon-renderer.token';
import { CanvasViewportTracker } from './canvas-viewport-tracker';
import { toPolygonCommand } from './polygon-keyboard-commands';

type ActiveGesture =
  | { readonly kind: 'drag'; readonly session: DragSession }
  | { readonly kind: 'rotate'; readonly session: RotateSession }
  | { readonly kind: 'scale'; readonly session: ScaleSession };

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

  private readonly imageEl = viewChild.required<ElementRef<HTMLImageElement>>('imageEl');
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');

  private readonly controller = inject(POLYGON_INTERACTION_CONTROLLER);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private activeGesture: ActiveGesture | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly scheduler = new CanvasRenderScheduler(inject(POLYGON_CANVAS_RENDERER));
  protected readonly canvasUnavailable = this.scheduler.contextUnavailable;

  private readonly viewport = new CanvasViewportTracker(() => this.imageEl().nativeElement);
  private readonly boxSize = this.viewport.boxSize;
  private readonly pixelRatio = this.viewport.pixelRatio;

  constructor() {
    effect(() => {
      const size = this.boxSize();
      if (size.width <= 0 || size.height <= 0) {
        return;
      }
      this.scheduler.schedule(this.canvasEl().nativeElement, {
        size,
        drawPoints: this.drawPoints(),
        mode: this.mode(),
        polygons: this.displayPolygons(),
        selectedId: this.selectedPolygon()?.id ?? null,
        pixelRatio: this.pixelRatio(),
      });
    });

    this.destroyRef.onDestroy(() => this.scheduler.destroy());
  }

  protected onPointerDown(event: PointerEvent): void {
    // Only the primary button drives drawing and gestures; a context-menu click must not
    // place a vertex or start a drag that the menu then interrupts.
    if (event.button !== 0) {
      return;
    }

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
      fromEvent<PointerEvent>(globalThis, 'pointerup'),
      fromEvent<PointerEvent>(globalThis, 'pointercancel'),
      fromEvent<Event>(globalThis, 'blur').pipe(map(() => null)),
    ).pipe(take(1), share());

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
      this.abortGesture(event.pointerId);
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

  private endGesture(event: PointerEvent | null): void {
    const activeGesture = this.activeGesture;
    if (!activeGesture) {
      return;
    }

    const finalPolygon = this.draftPolygon();
    if (finalPolygon && event?.type === 'pointerup') {
      if (activeGesture.kind === 'drag') {
        this.polygonMoved.emit({ polygonId: finalPolygon.id, position: finalPolygon.position });
      } else if (activeGesture.kind === 'rotate') {
        this.polygonRotated.emit({
          polygonId: finalPolygon.id,
          rotationRadians: finalPolygon.rotationRadians,
        });
      } else {
        this.polygonScaled.emit({ polygonId: finalPolygon.id, scale: finalPolygon.scale });
      }
    }

    this.abortGesture(event?.pointerId ?? null);
  }

  /**
   * `releasePointerCapture` throws `NotFoundError` when the pointer is no longer active, which
   * is the normal state after a touch `pointerup`. Only release capture we actually hold.
   */
  private abortGesture(pointerId: number | null): void {
    this.activeGesture = null;
    this.draftPolygon.set(null);

    if (pointerId === null) {
      return;
    }

    const canvas = this.canvasEl().nativeElement;
    if (canvas.hasPointerCapture?.(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
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
    // The toolbar button that triggered this may now be removed from the DOM; keep focus on the
    // canvas, which always exists and is where editing continues.
    this.canvasEl().nativeElement.focus();
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
    this.announce(`Polygon ${nextIndex + 1} of ${polygons.length} selected.`);
    this.polygonSelected.emit(polygons[nextIndex].id);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const selected = this.selectedPolygon();
    if (!selected) {
      return;
    }

    const command = toPolygonCommand(event.key);
    if (!command) {
      return;
    }

    event.preventDefault();

    switch (command.kind) {
      case 'move':
        this.commitNudge(selected, command.delta, command.direction);
        return;
      case 'rotate':
        this.commitRotate(selected, command.deltaRadians, command.direction);
        return;
      case 'scale':
        this.commitScale(selected, command.factor);
        return;
      case 'deselect':
        this.polygonSelected.emit(null);
        return;
      case 'delete':
        this.onDeletePolygon(selected.id);
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
}
