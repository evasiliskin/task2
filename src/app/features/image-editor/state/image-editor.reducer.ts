import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { appConfig } from '@core/config/app-config';
import { clampPolygonScale } from '../domain/geometry/clamp-polygon-scale';
import { Polygon } from '../domain/polygon.model';
import { ImageEditorActions } from './image-editor.actions';

const { maxStoredPolygons } = appConfig.imageEditor;

export interface ImageEditorState extends EntityState<Polygon> {
  readonly selectedPolygonId: string | null;
}

export const polygonAdapter = createEntityAdapter<Polygon>({
  selectId: (polygon) => polygon.id,
});

export const initialState: ImageEditorState = polygonAdapter.getInitialState({
  selectedPolygonId: null,
});

function evictOldestPolygons(state: ImageEditorState): ImageEditorState {
  if (state.ids.length <= maxStoredPolygons) {
    return state;
  }

  const surplus = state.ids.length - maxStoredPolygons;
  const evictedIds = [...state.ids]
    .map((id) => state.entities[String(id)])
    .filter((polygon): polygon is Polygon => polygon !== undefined)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, surplus)
    .map((polygon) => polygon.id);

  const evicted = polygonAdapter.removeMany(evictedIds, state);

  return evicted.selectedPolygonId !== null && evictedIds.includes(evicted.selectedPolygonId)
    ? { ...evicted, selectedPolygonId: null }
    : evicted;
}

export const imageEditorFeature = createFeature({
  name: 'imageEditor',
  reducer: createReducer(
    initialState,
    on(ImageEditorActions.polygonCreated, (state, { polygon }) =>
      evictOldestPolygons({
        ...polygonAdapter.addOne(polygon, state),
        selectedPolygonId: polygon.id,
      }),
    ),
    on(ImageEditorActions.polygonMoved, (state, { polygonId, position }) =>
      polygonAdapter.updateOne({ id: polygonId, changes: { position } }, state),
    ),
    on(ImageEditorActions.polygonRotated, (state, { polygonId, rotationRadians }) =>
      polygonAdapter.updateOne({ id: polygonId, changes: { rotationRadians } }, state),
    ),
    on(ImageEditorActions.polygonScaled, (state, { polygonId, scale }) =>
      polygonAdapter.updateOne(
        { id: polygonId, changes: { scale: clampPolygonScale(scale) } },
        state,
      ),
    ),
    on(ImageEditorActions.polygonDeleted, (state, { polygonId }) => {
      const removed = polygonAdapter.removeOne(polygonId, state);
      return state.selectedPolygonId === polygonId
        ? { ...removed, selectedPolygonId: null }
        : removed;
    }),
    on(ImageEditorActions.polygonSelected, (state, { polygonId }) => ({
      ...state,
      selectedPolygonId: polygonId,
    })),
  ),
  extraSelectors: ({ selectImageEditorState, selectIds }) => ({
    ...polygonAdapter.getSelectors(selectImageEditorState),
    selectIsAtPolygonCapacity: createSelector(selectIds, (ids) => ids.length >= maxStoredPolygons),
  }),
});
