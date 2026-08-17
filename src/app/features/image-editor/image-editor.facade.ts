import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { CLOCK } from '@core/time/clock.token';
import { createPolygonFromPoints } from './domain/geometry/create-polygon-from-points';
import { NormalizedPoint } from './domain/normalized-point.model';
import { Polygon } from './domain/polygon.model';
import { POLYGON_ID } from './domain/polygon-id.token';
import { ImageEditorActions } from './state/image-editor.actions';
import { imageEditorFeature } from './state/image-editor.reducer';

@Injectable({ providedIn: 'root' })
export class ImageEditorFacade {
  private readonly store = inject(Store);
  private readonly nextPolygonId = inject(POLYGON_ID);
  private readonly now = inject(CLOCK);

  private readonly polygons = toSignal(this.store.select(imageEditorFeature.selectAll), {
    requireSync: true,
  });
  private readonly selectedPolygonId = toSignal(
    this.store.select(imageEditorFeature.selectSelectedPolygonId),
    { requireSync: true },
  );

  readonly isAtCapacity = toSignal(
    this.store.select(imageEditorFeature.selectIsAtPolygonCapacity),
    { requireSync: true },
  );

  polygonsFor(imageId: string): Signal<readonly Polygon[]> {
    return computed(() => this.polygons().filter((polygon) => polygon.imageId === imageId));
  }

  selectedPolygonFor(imageId: string): Signal<Polygon | null> {
    return computed(() => {
      const selectedId = this.selectedPolygonId();
      const selected = this.polygons().find((polygon) => polygon.id === selectedId);
      return selected && selected.imageId === imageId ? selected : null;
    });
  }

  createPolygon(rawPoints: readonly NormalizedPoint[], imageId: string): void {
    this.store.dispatch(
      ImageEditorActions.polygonCreated({
        polygon: createPolygonFromPoints(rawPoints, imageId, this.nextPolygonId(), this.now()),
      }),
    );
  }

  movePolygon(polygonId: string, position: NormalizedPoint): void {
    this.store.dispatch(ImageEditorActions.polygonMoved({ polygonId, position }));
  }

  rotatePolygon(polygonId: string, rotationRadians: number): void {
    this.store.dispatch(ImageEditorActions.polygonRotated({ polygonId, rotationRadians }));
  }

  scalePolygon(polygonId: string, scale: number): void {
    this.store.dispatch(ImageEditorActions.polygonScaled({ polygonId, scale }));
  }

  deletePolygon(polygonId: string): void {
    this.store.dispatch(ImageEditorActions.polygonDeleted({ polygonId }));
  }

  selectPolygon(polygonId: string | null): void {
    this.store.dispatch(ImageEditorActions.polygonSelected({ polygonId }));
  }
}
