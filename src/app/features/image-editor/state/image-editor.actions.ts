import { createActionGroup, props } from '@ngrx/store';
import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';

export const ImageEditorActions = createActionGroup({
  source: 'Image Editor',
  events: {
    'Polygon Created': props<{ polygon: Polygon }>(),
    'Polygon Moved': props<{ polygonId: string; position: NormalizedPoint }>(),
    'Polygon Rotated': props<{ polygonId: string; rotationRadians: number }>(),
    'Polygon Scaled': props<{ polygonId: string; scale: number }>(),
    'Polygon Deleted': props<{ polygonId: string }>(),
    'Polygon Selected': props<{ polygonId: string | null }>(),
  },
});
