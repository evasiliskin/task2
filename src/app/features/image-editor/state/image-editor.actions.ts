import { createActionGroup, props } from '@ngrx/store';
import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';

export const ImageEditorActions = createActionGroup({
  source: 'Image Editor',
  events: {
    'Polygon Created': props<{ polygon: Polygon }>(),
    'Polygon Moved': props<{ imageId: string; position: NormalizedPoint }>(),
    'Polygon Rotated': props<{ imageId: string; rotationRadians: number }>(),
    'Polygon Deleted': props<{ imageId: string }>(),
  },
});
