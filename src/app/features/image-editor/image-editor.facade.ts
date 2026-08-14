import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { createPolygonFromPoints } from './domain/geometry/create-polygon-from-points';
import { NormalizedPoint } from './domain/normalized-point.model';
import { Polygon } from './domain/polygon.model';
import { ImageEditorActions } from './state/image-editor.actions';
import { imageEditorFeature } from './state/image-editor.reducer';

@Injectable({ providedIn: 'root' })
export class ImageEditorFacade {
  private readonly store = inject(Store);

  polygonFor$(imageId: string): Observable<Polygon | null> {
    return this.store.select(imageEditorFeature.selectPolygonByImageId(imageId));
  }

  createPolygon(rawPoints: readonly NormalizedPoint[], imageId: string): void {
    this.store.dispatch(
      ImageEditorActions.polygonCreated({ polygon: createPolygonFromPoints(rawPoints, imageId) }),
    );
  }

  movePolygon(imageId: string, position: NormalizedPoint): void {
    this.store.dispatch(ImageEditorActions.polygonMoved({ imageId, position }));
  }

  rotatePolygon(imageId: string, rotationRadians: number): void {
    this.store.dispatch(ImageEditorActions.polygonRotated({ imageId, rotationRadians }));
  }

  deletePolygon(imageId: string): void {
    this.store.dispatch(ImageEditorActions.polygonDeleted({ imageId }));
  }
}
