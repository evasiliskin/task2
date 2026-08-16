import { ImageEditorActions } from './image-editor.actions';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

describe('image-editor actions', () => {
  it('should create a Polygon Created action carrying the full polygon, when polygonCreated is dispatched', () => {
    const polygon = {
      id: POLYGON_ID,
      imageId: IMAGE_ID,
      points: [{ x: -0.1, y: -0.1 }],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: 0,
      scale: 1,
      createdAt: 0,
    };
    const action = ImageEditorActions.polygonCreated({ polygon });

    expect(action.type).toBe('[Image Editor] Polygon Created');
    expect(action.polygon).toBe(polygon);
  });

  it('should create a Polygon Moved action carrying the polygonId and new position, when polygonMoved is dispatched', () => {
    const action = ImageEditorActions.polygonMoved({
      polygonId: POLYGON_ID,
      position: { x: 0.2, y: 0.3 },
    });

    expect(action.type).toBe('[Image Editor] Polygon Moved');
    expect(action.polygonId).toBe(POLYGON_ID);
    expect(action.position).toEqual({ x: 0.2, y: 0.3 });
  });

  it('should create a Polygon Rotated action carrying the polygonId and new rotation, when polygonRotated is dispatched', () => {
    const action = ImageEditorActions.polygonRotated({
      polygonId: POLYGON_ID,
      rotationRadians: Math.PI / 4,
    });

    expect(action.type).toBe('[Image Editor] Polygon Rotated');
    expect(action.polygonId).toBe(POLYGON_ID);
    expect(action.rotationRadians).toBe(Math.PI / 4);
  });

  it('should create a Polygon Scaled action carrying the polygonId and new scale, when polygonScaled is dispatched', () => {
    const action = ImageEditorActions.polygonScaled({
      polygonId: POLYGON_ID,
      scale: 2,
    });

    expect(action.type).toBe('[Image Editor] Polygon Scaled');
    expect(action.polygonId).toBe(POLYGON_ID);
    expect(action.scale).toBe(2);
  });

  it('should create a Polygon Deleted action carrying the polygonId, when polygonDeleted is dispatched', () => {
    const action = ImageEditorActions.polygonDeleted({ polygonId: POLYGON_ID });

    expect(action.type).toBe('[Image Editor] Polygon Deleted');
    expect(action.polygonId).toBe(POLYGON_ID);
  });

  it('should create a Polygon Selected action carrying the polygonId, when polygonSelected is dispatched', () => {
    const action = ImageEditorActions.polygonSelected({ polygonId: POLYGON_ID });

    expect(action.type).toBe('[Image Editor] Polygon Selected');
    expect(action.polygonId).toBe(POLYGON_ID);
  });

  it('should create a Polygon Selected action carrying null, when polygonSelected is dispatched with no selection', () => {
    const action = ImageEditorActions.polygonSelected({ polygonId: null });

    expect(action.type).toBe('[Image Editor] Polygon Selected');
    expect(action.polygonId).toBeNull();
  });
});
