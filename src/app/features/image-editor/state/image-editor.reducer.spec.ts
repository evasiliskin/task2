import { imageEditorFeature, initialState } from './image-editor.reducer';
import { ImageEditorActions } from './image-editor.actions';
import { Polygon } from '../domain/polygon.model';

const { reducer } = imageEditorFeature;

function makePolygon(imageId: string): Polygon {
  return {
    id: imageId,
    imageId,
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
  };
}

describe('image-editor reducer', () => {
  it('should return the initial state, when the action is unknown', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.ids).toEqual([]);
  });

  it('should add a new polygon keyed by imageId, when polygonCreated is dispatched', () => {
    const polygon = makePolygon('image-1');
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(state.ids).toEqual(['image-1']);
    expect(state.entities['image-1']).toEqual(polygon);
  });

  it('should replace the existing polygon for that image, when polygonCreated is dispatched again for the same imageId', () => {
    const first = makePolygon('image-1');
    const second = { ...makePolygon('image-1'), rotationRadians: 1 };
    const afterFirst = reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first }));
    const afterSecond = reducer(afterFirst, ImageEditorActions.polygonCreated({ polygon: second }));

    expect(afterSecond.ids).toEqual(['image-1']);
    expect(afterSecond.entities['image-1']).toEqual(second);
  });

  it('should update only the position of the matching polygon, when polygonMoved is dispatched', () => {
    const polygon = makePolygon('image-1');
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({ imageId: 'image-1', position: { x: 0.2, y: 0.3 } }),
    );

    expect(state.entities['image-1']?.position).toEqual({ x: 0.2, y: 0.3 });
    expect(state.entities['image-1']?.rotationRadians).toBe(0);
    expect(state.entities['image-1']?.points).toEqual(polygon.points);
  });

  it('should update only the rotation of the matching polygon, when polygonRotated is dispatched', () => {
    const polygon = makePolygon('image-1');
    const afterCreate = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonRotated({ imageId: 'image-1', rotationRadians: Math.PI / 4 }),
    );

    expect(state.entities['image-1']?.rotationRadians).toBe(Math.PI / 4);
    expect(state.entities['image-1']?.position).toEqual(polygon.position);
  });

  it('should be a no-op, when polygonMoved is dispatched for an imageId with no stored polygon', () => {
    const state = reducer(
      initialState,
      ImageEditorActions.polygonMoved({ imageId: 'missing', position: { x: 0.2, y: 0.3 } }),
    );

    expect(state).toBe(initialState);
  });

  it('should be a no-op, when polygonRotated is dispatched for an imageId with no stored polygon', () => {
    const state = reducer(
      initialState,
      ImageEditorActions.polygonRotated({ imageId: 'missing', rotationRadians: 1 }),
    );

    expect(state).toBe(initialState);
  });

  it("should leave other images' polygons untouched, when polygonCreated is dispatched for a second imageId", () => {
    const first = makePolygon('image-1');
    const second = makePolygon('image-2');
    const afterFirst = reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first }));
    const state = reducer(afterFirst, ImageEditorActions.polygonCreated({ polygon: second }));

    expect(state.ids).toEqual(['image-1', 'image-2']);
    expect(state.entities['image-1']).toEqual(first);
    expect(state.entities['image-2']).toEqual(second);
  });

  it("should leave other images' polygons untouched, when polygonMoved is dispatched for one imageId among several", () => {
    const first = makePolygon('image-1');
    const second = makePolygon('image-2');
    const afterCreate = reducer(
      reducer(initialState, ImageEditorActions.polygonCreated({ polygon: first })),
      ImageEditorActions.polygonCreated({ polygon: second }),
    );
    const state = reducer(
      afterCreate,
      ImageEditorActions.polygonMoved({ imageId: 'image-2', position: { x: 0.9, y: 0.9 } }),
    );

    expect(state.entities['image-1']).toEqual(first);
    expect(state.entities['image-2']?.position).toEqual({ x: 0.9, y: 0.9 });
  });
});

describe('image-editor selectors', () => {
  it('should return the stored polygon, when selectPolygonByImageId is selected for an image with a saved polygon', () => {
    const polygon = makePolygon('image-1');
    const state = reducer(initialState, ImageEditorActions.polygonCreated({ polygon }));

    expect(imageEditorFeature.selectPolygonByImageId('image-1')({ imageEditor: state })).toEqual(
      polygon,
    );
  });

  it('should return null, when selectPolygonByImageId is selected for an image with no saved polygon', () => {
    expect(
      imageEditorFeature.selectPolygonByImageId('missing')({ imageEditor: initialState }),
    ).toBeNull();
  });
});
