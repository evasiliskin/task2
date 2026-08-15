import { imageEditorFeature, initialState, MAX_STORED_POLYGONS } from './image-editor.reducer';
import { ImageEditorActions } from './image-editor.actions';
import { Polygon } from '../domain/polygon.model';
import { MAX_POLYGON_SCALE } from '../domain/geometry/clamp-polygon-scale';

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
  return polygonFixture(id, 'image-1');
}

describe('image-editor reducer', () => {
  it('should return the initial state, when the action is unknown', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.ids).toEqual([]);
  });

  it('should add a new polygon keyed by id, when polygonCreated is dispatched', () => {
    const polygon = makePolygon('p1');
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(state.ids).toEqual(['p1']);
    expect(state.entities['p1']).toEqual(polygon);
  });

  it('should update only the position of the matching polygon, when polygonMoved is dispatched', () => {
    const polygon = makePolygon('p1');
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({ polygonId: 'p1', position: { x: 0.2, y: 0.3 } }),
    );

    expect(state.entities['p1']?.position).toEqual({ x: 0.2, y: 0.3 });
    expect(state.entities['p1']?.rotationRadians).toBe(0);
    expect(state.entities['p1']?.points).toEqual(polygon.points);
  });

  it('should update only the rotation of the matching polygon, when polygonRotated is dispatched', () => {
    const polygon = makePolygon('p1');
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonRotated({ polygonId: 'p1', rotationRadians: Math.PI / 4 }),
    );

    expect(state.entities['p1']?.rotationRadians).toBe(Math.PI / 4);
    expect(state.entities['p1']?.position).toEqual(polygon.position);
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
    const first = makePolygon('p1');
    const second = makePolygon('p2');
    const afterFirst = reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first }));
    const state = reducer(afterFirst, ImageEditorActions.polygonCreated({ polygon: second }));

    expect(state.ids).toEqual(['p1', 'p2']);
    expect(state.entities['p1']).toEqual(first);
    expect(state.entities['p2']).toEqual(second);
  });

  it('should leave other polygons untouched, when polygonMoved is dispatched for one polygon among several', () => {
    const first = makePolygon('p1');
    const second = makePolygon('p2');
    const afterCreate = reducer(
      reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first })),
      ImageEditorActions.polygonCreated({ polygon: second }),
    );
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({ polygonId: 'p2', position: { x: 0.9, y: 0.9 } }),
    );

    expect(state.entities['p1']).toEqual(first);
    expect(state.entities['p2']?.position).toEqual({ x: 0.9, y: 0.9 });
  });

  it('should remove the matching polygon, when polygonDeleted is dispatched', () => {
    const polygon = makePolygon('p1');
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    const state = reducer(afterCreate, ImageEditorActions.polygonDeleted({ polygonId: 'p1' }));

    expect(state.ids).toEqual([]);
    expect(state.entities['p1']).toBeUndefined();
  });

  it('should leave other polygons untouched, when polygonDeleted is dispatched for one polygon among several', () => {
    const first = makePolygon('p1');
    const second = makePolygon('p2');
    const afterCreate = reducer(
      reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first })),
      ImageEditorActions.polygonCreated({ polygon: second }),
    );

    const state = reducer(afterCreate, ImageEditorActions.polygonDeleted({ polygonId: 'p1' }));

    expect(state.ids).toEqual(['p2']);
    expect(state.entities['p2']).toEqual(second);
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
              imageId: 'image-1',
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
    expect(state.entities['p0']).toBeUndefined();
    expect(state.entities[`p${MAX_STORED_POLYGONS}`]).toBeDefined();
  });

  it('should evict the oldest polygon by createdAt, when the store exceeds capacity', () => {
    const polygonAt = (id: string, createdAt: number): Polygon => ({
      id,
      imageId: 'i1',
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
    const polygon = makePolygon('p1');
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(imageEditorFeature.selectEntities({ imageEditor: state })['p1']).toEqual(polygon);
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
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('p1', 'image-1') }),
    );
    const state = imageEditorFeature.reducer(
      first,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('p2', 'image-1') }),
    );

    expect(state.ids).toEqual(['p1', 'p2']);
  });

  it('should select the new polygon, when one is created', () => {
    const state = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('p1', 'image-1') }),
    );

    expect(state.selectedPolygonId).toBe('p1');
  });

  it('should clear the selection, when the selected polygon is deleted', () => {
    const created = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('p1', 'image-1') }),
    );

    const state = imageEditorFeature.reducer(
      created,
      ImageEditorActions.polygonDeleted({ polygonId: 'p1' }),
    );

    expect(state.selectedPolygonId).toBeNull();
    expect(state.ids).toEqual([]);
  });

  it('should keep the selection, when a different polygon is deleted', () => {
    const withTwo = [polygonFixture('p1', 'image-1'), polygonFixture('p2', 'image-1')].reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );

    const state = imageEditorFeature.reducer(
      withTwo,
      ImageEditorActions.polygonDeleted({ polygonId: 'p1' }),
    );

    expect(state.selectedPolygonId).toBe('p2');
  });

  it('should store the clamped scale, when a polygon is scaled', () => {
    const created = imageEditorFeature.reducer(
      initialState,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('p1', 'image-1') }),
    );

    const state = imageEditorFeature.reducer(
      created,
      ImageEditorActions.polygonScaled({ polygonId: 'p1', scale: 999 }),
    );

    expect(state.entities['p1']?.scale).toBe(MAX_POLYGON_SCALE);
  });

  it('should clear the selection, when the selected polygon is evicted by the cap', () => {
    const atCap = Array.from({ length: MAX_STORED_POLYGONS }, (_unused, index) =>
      polygonFixture(`p${index}`, 'image-1'),
    ).reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );
    const withOldestSelected = imageEditorFeature.reducer(
      atCap,
      ImageEditorActions.polygonSelected({ polygonId: 'p0' }),
    );

    const state = imageEditorFeature.reducer(
      withOldestSelected,
      ImageEditorActions.polygonCreated({ polygon: polygonFixture('overflow', 'image-1') }),
    );

    expect(state.entities['p0']).toBeUndefined();
    expect(state.ids).toHaveLength(MAX_STORED_POLYGONS);
    expect(state.selectedPolygonId).toBe('overflow');
  });

  it('should keep the surviving selection, when a different polygon is evicted by the cap', () => {
    const atCap = Array.from({ length: MAX_STORED_POLYGONS }, (_unused, index) =>
      polygonFixture(`p${index}`, 'image-1'),
    ).reduce(
      (state, polygon) =>
        imageEditorFeature.reducer(state, ImageEditorActions.polygonCreated({ polygon })),
      initialState,
    );

    const state = imageEditorFeature.reducer(
      atCap,
      ImageEditorActions.polygonSelected({ polygonId: 'p5' }),
    );

    expect(state.selectedPolygonId).toBe('p5');
  });
});
