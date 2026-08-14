import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { Polygon } from '../domain/polygon.model';
import { ImageEditorActions } from './image-editor.actions';

export type ImageEditorState = EntityState<Polygon>;

export const polygonAdapter = createEntityAdapter<Polygon>({
  selectId: (polygon) => polygon.imageId,
});

export const initialState: ImageEditorState = polygonAdapter.getInitialState();

export const imageEditorFeature = createFeature({
  name: 'imageEditor',
  reducer: createReducer(
    initialState,
    on(ImageEditorActions.polygonCreated, (state, { polygon }) =>
      polygonAdapter.upsertOne(polygon, state),
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
    selectPolygonByImageId: (imageId: string) =>
      createSelector(selectImageEditorState, (state) => state.entities[imageId] ?? null),
  }),
});

export const {
  selectImageEditorState,
  selectIds: selectPolygonIds,
  selectEntities: selectPolygonEntities,
  selectAll: selectAllPolygons,
  selectTotal: selectPolygonCount,
  selectPolygonByImageId,
} = imageEditorFeature;
