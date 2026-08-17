import { imageEditorFeature, initialState, MAX_STORED_POLYGONS } from './image-editor.reducer';
import { ImageEditorActions } from './image-editor.actions';
import { Polygon } from '../domain/polygon.model';
import { MAX_POLYGON_SCALE } from '../domain/geometry/clamp-polygon-scale';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const SECOND_POLYGON_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
const MISSING_POLYGON_ID = '8f14e45f-ceea-467a-9e1f-3b0c44afea34';
const UNKNOWN_POLYGON_ID = 'c56a4180-65aa-42ec-a945-5fd21dec0538';

const { reducer } = imageEditorFeature;

function polygonFixture(id: string, imageId: string): Polygon {
  return {
    id,
    imageId,
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
    scale: 1,
    createdAt: 0,
  };
}

function makePolygon(id: string): Polygon {
  return polygonFixture(id, IMAGE_ID);
}

describe('image-editor reducer', () => {
  it('should return the initial state, when the action is unknown', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.ids).toEqual([]);
  });

  it('should add a new polygon keyed by id, when polygonCreated is dispatched', () => {
    const polygon = makePolygon(POLYGON_ID);
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(state.ids).toEqual([POLYGON_ID]);
    expect(state.entities[POLYGON_ID]).toEqual(polygon);
  });

  it('should update only the position of the matching polygon, when polygonMoved is dispatched', () => {
    const polygon = makePolygon(POLYGON_ID);
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({ polygonId: POLYGON_ID, position: { x: 0.2, y: 0.3 } }),
    );

    expect(state.entities[POLYGON_ID]?.position).toEqual({ x: 0.2, y: 0.3 });
    expect(state.entities[POLYGON_ID]?.rotationRadians).toBe(0);
    expect(state.entities[POLYGON_ID]?.points).toEqual(polygon.points);
  });

  it('should update only the rotation of the matching polygon, when polygonRotated is dispatched', () => {
    const polygon = makePolygon(POLYGON_ID);
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonRotated({ polygonId: POLYGON_ID, rotationRadians: Math.PI / 4 }),
    );

    expect(state.entities[POLYGON_ID]?.rotationRadians).toBe(Math.PI / 4);
    expect(state.entities[POLYGON_ID]?.position).toEqual(polygon.position);
  });

  it('should be a no-op, when polygonMoved is dispatched for a polygonId with no stored polygon', () => {
    const state = reducer(
      initialState,
      ImageEditorActions.polygonMoved({ polygonId: 'missing', position: { x: 0.2, y: 0.3 } }),
    );

    expect(state).toBe(initialState);
  });

  it('should be a no-op, when polygonRotated is dispatched for a polygonId with no stored polygon', () => {
    const state = reducer(
      initialState,
      ImageEditorActions.polygonRotated({ polygonId: 'missing', rotationRadians: 1 }),
    );

    expect(state).toBe(initialState);
  });

  it('should leave other polygons untouched, when polygonCreated is dispatched for a second polygon', () => {
    const first = makePolygon(POLYGON_ID);
    const second = makePolygon(SECOND_POLYGON_ID);
    const afterFirst = reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first }));
    const state = reducer(afterFirst, ImageEditorActions.polygonCreated({ polygon: second }));

    expect(state.ids).toEqual([POLYGON_ID, SECOND_POLYGON_ID]);
    expect(state.entities[POLYGON_ID]).toEqual(first);
    expect(state.entities[SECOND_POLYGON_ID]).toEqual(second);
  });

  it('should leave other polygons untouched, when polygonMoved is dispatched for one polygon among several', () => {
    const first = makePolygon(POLYGON_ID);
    const second = makePolygon(SECOND_POLYGON_ID);
    const afterCreate = reducer(
      reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first })),
      ImageEditorActions.polygonCreated({ polygon: second }),
    );
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({
        polygonId: SECOND_POLYGON_ID,
        position: { x: 0.9, y: 0.9 },
      }),
    );

    expect(state.entities[POLYGON_ID]).toEqual(first);
    expect(state.entities[SECOND_POLYGON_ID]?.position).toEqual({ x: 0.9, y: 0.9 });
  });

  it('should remove the matching polygon, when polygonDeleted is dispatched', () => {
    const polygon = makePolygon(POLYGON_ID);
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonDeleted({ polygonId: POLYGON_ID }),
    );

    expect(state.ids).toEqual([]);
    expect(state.entities[POLYGON_ID]).toBeUndefined();
  });

  it('should leave other polygons untouched, when polygonDeleted is dispatched for one polygon among several', () => {
    const first = makePolygon(POLYGON_ID);
    const second = makePolygon(SECOND_POLYGON_ID);
    const afterCreate = reducer(
      reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first })),
      ImageEditorActions.polygonCreated({ polygon: second }),
    );

    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonDeleted({ polygonId: POLYGON_ID }),
    );

    expect(state.ids).toEqual([SECOND_POLYGON_ID]);
    expect(state.entities[SECOND_POLYGON_ID]).toEqual(second);
  });

  it('should be a no-op, when polygonDeleted is dispatched for a polygonId with no stored polygon', () => {
    const state = reducer(
      initialState,
      ImageEditorActions.polygonDeleted({ polygonId: 'missing' }),
    );

    expect(state).toBe(initialState);
  });

  it('should evict the oldest polygon, when the cap is exceeded', () => {
    const state = Array.from({ length: MAX_STORED_POLYGONS + 1 }, (_unused, index) => index).reduce(
      (accumulated, index) =>
        imageEditorFeature.reducer(
          accumulated,
          ImageEditorActions.polygonCreated({
            polygon: {
              id: `p${index}`,
              imageId: IMAGE_ID,
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
              ],
              position: { x: 0.5, y: 0.5 },
              rotationRadians: 0,
              scale: 1,
              createdAt: 0,
            },
          }),
        ),
      initialState,
    );

    expect(state.ids).toHaveLength(MAX_STORED_POLYGONS);
    expect(state.entities[MISSING_POLYGON_ID]).toBeUndefined();
    expect(state.entities[`p${MAX_STORED_POLYGONS}`]).toBeDefined();
  });

  it('should evict the oldest polygon by createdAt, when the store exceeds capacity', () => {
    const polygonAt = (id: string, createdAt: number): Polygon => ({
      id,
      imageId: IMAGE_ID,
      points: [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: -0.1 },
        { x: 0, y: 0.1 },
      ],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: 0,
      scale: 1,
      createdAt,
    });

    let state = initialState;
    for (let index = 0; index < MAX_STORED_POLYGONS; index++) {
      state = reducer(
        state,
        ImageEditorActions.polygonCreated({ polygon: polygonAt(`p${index}`, 1_000 - index) }),
      );
    }
    state = reducer(
      state,
      ImageEditorActions.polygonCreated({ polygon: polygonAt('newest', 5_000) }),
    );

    expect(state.ids).toHaveLength(MAX_STORED_POLYGONS);
    expect(state.entities[`p${MAX_STORED_POLYGONS - 1}`]).toBeUndefined();
    expect(state.entities['newest']).toBeDefined();
  });
});

describe('image-editor selectors', () => {
  it('should return the stored polygon, when selectEntities is selected for a polygon id that was saved', () => {
    const polygon = makePolygon(POLYGON_ID);
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(imageEditorFeature.selectEntities({ imageEditor: state })[POLYGON_ID]).toEqual(polygon);
  });

  it('should return undefined, when selectEntities is selected for a polygon id with no saved polygon', () => {
    expect(
      imageEditorFeature.selectEntities({ imageEditor: initialState })['missing'],
    ).toBeUndefined();
  });
});

describe('image editor reducer — multiple polygons', () => {
  it('should keep both polygons, when two are created for the same image', () => {
    const first = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture(POLYGON_ID, IMAGE_ID) }),
    );
    const state = imageEditorFeature.reducer(
      first,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture(SECOND_POLYGON_ID, IMAGE_ID) }),
    );

    expect(state.ids).toEqual([POLYGON_ID, SECOND_POLYGON_ID]);
  });

  it('should select the new polygon, when one is created', () => {
    const state = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture(POLYGON_ID, IMAGE_ID) }),
    );

    expect(state.selectedPolygonId).toBe(POLYGON_ID);
  });

  it('should clear the selection, when the selected polygon is deleted', () => {
    const created = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture(POLYGON_ID, IMAGE_ID) }),
    );

    const state = imageEditorFeature.reducer(
      created,
      ImageEditorActions.polygonDeleted({ polygonId: POLYGON_ID }),
    );

    expect(state.selectedPolygonId).toBeNull();
    expect(state.ids).toEqual([]);
  });

  it('should keep the selection, when a different polygon is deleted', () => {
    const withTwo = [
      polygonFixture(POLYGON_ID, IMAGE_ID),
      polygonFixture(SECOND_POLYGON_ID, IMAGE_ID),
    ].reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );

    const state = imageEditorFeature.reducer(
      withTwo,
      ImageEditorActions.polygonDeleted({ polygonId: POLYGON_ID }),
    );

    expect(state.selectedPolygonId).toBe(SECOND_POLYGON_ID);
  });

  it('should store the clamped scale, when a polygon is scaled', () => {
    const created = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture(POLYGON_ID, IMAGE_ID) }),
    );

    const state = imageEditorFeature.reducer(
      created,
      ImageEditorActions.polygonScaled({ polygonId: POLYGON_ID, scale: 999 }),
    );

    expect(state.entities[POLYGON_ID]?.scale).toBe(MAX_POLYGON_SCALE);
  });

  it('should clear the selection, when the selected polygon is evicted by the cap', () => {
    const atCap = Array.from({ length: MAX_STORED_POLYGONS }, (_unused, index) =>
      polygonFixture(`p${index}`, IMAGE_ID),
    ).reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );
    const withOldestSelected = imageEditorFeature.reducer(
      atCap,
      ImageEditorActions.polygonSelected({ polygonId: MISSING_POLYGON_ID }),
    );

    const state = imageEditorFeature.reducer(
      withOldestSelected,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('overflow', IMAGE_ID) }),
    );

    expect(state.entities[MISSING_POLYGON_ID]).toBeUndefined();
    expect(state.ids).toHaveLength(MAX_STORED_POLYGONS);
    expect(state.selectedPolygonId).toBe('overflow');
  });

  it('should keep the surviving selection, when a different polygon is evicted by the cap', () => {
    const atCap = Array.from({ length: MAX_STORED_POLYGONS }, (_unused, index) =>
      polygonFixture(`p${index}`, IMAGE_ID),
    ).reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );

    const state = imageEditorFeature.reducer(
      atCap,
      ImageEditorActions.polygonSelected({ polygonId: UNKNOWN_POLYGON_ID }),
    );

    expect(state.selectedPolygonId).toBe(UNKNOWN_POLYGON_ID);
  });
});
