import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { Polygon } from '../domain/polygon.model';
import { ImageEditorActions } from './image-editor.actions';

export const MAX_STORED_POLYGONS = 50;

export type ImageEditorState = EntityState<Polygon>;

export const polygonAdapter = createEntityAdapter<Polygon>({
  selectId: (polygon) => polygon.imageId,
});

export const initialState: ImageEditorState = polygonAdapter.getInitialState();

function evictOldestPolygons(state: ImageEditorState): ImageEditorState {
  if (state.ids.length <= MAX_STORED_POLYGONS) {
    return state;
  }
  const surplus = state.ids.length - MAX_STORED_POLYGONS;
  return polygonAdapter.removeMany(state.ids.slice(0, surplus).map(String), state);
}

export const imageEditorFeature = createFeature({
  name: 'imageEditor',
  reducer: createReducer(
    initialState,
    on(ImageEditorActions.polygonCreated, (state, { polygon }) =>
      evictOldestPolygons(polygonAdapter.upsertOne(polygon, state)),
    ),
    on(ImageEditorActions.polygonMoved, (state, { imageId, position }) =>
      polygonAdapter.updateOne({ id: imageId, changes: { position } }, state),
    ),
    on(ImageEditorActions.polygonRotated, (state, { imageId, rotationRadians }) =>
      polygonAdapter.updateOne({ id: imageId, changes: { rotationRadians } }, state),
    ),
    on(ImageEditorActions.polygonDeleted, (state, { imageId }) =>
      polygonAdapter.removeOne(imageId, state),
    ),
  ),
  extraSelectors: ({ selectImageEditorState }) => ({
    ...polygonAdapter.getSelectors(selectImageEditorState),
  }),
});
