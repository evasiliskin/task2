import { ImageEditorActions } from './image-editor.actions';

describe('image-editor actions', () => {
  it('should create a Polygon Created action carrying the full polygon, when polygonCreated is dispatched', () => {
    const polygon = {
      id: 'image-1',
      imageId: 'image-1',
      points: [{ x: -0.1, y: -0.1 }],
      position: { x: 0.5, y: 0.5 },
      rotationRadians: 0,
    };
    const action = ImageEditorActions.polygonCreated({ polygon });

    expect(action.type).toBe('[Image Editor] Polygon Created');
    expect(action.polygon).toBe(polygon);
  });

  it('should create a Polygon Moved action carrying the imageId and new position, when polygonMoved is dispatched', () => {
    const action = ImageEditorActions.polygonMoved({
      imageId: 'image-1',
      position: { x: 0.2, y: 0.3 },
    });

    expect(action.type).toBe('[Image Editor] Polygon Moved');
    expect(action.imageId).toBe('image-1');
    expect(action.position).toEqual({ x: 0.2, y: 0.3 });
  });

  it('should create a Polygon Rotated action carrying the imageId and new rotation, when polygonRotated is dispatched', () => {
    const action = ImageEditorActions.polygonRotated({
      imageId: 'image-1',
      rotationRadians: Math.PI / 4,
    });

    expect(action.type).toBe('[Image Editor] Polygon Rotated');
    expect(action.imageId).toBe('image-1');
    expect(action.rotationRadians).toBe(Math.PI / 4);
  });

  it('should create a Polygon Deleted action carrying the imageId, when polygonDeleted is dispatched', () => {
    const action = ImageEditorActions.polygonDeleted({ imageId: 'image-1' });

    expect(action.type).toBe('[Image Editor] Polygon Deleted');
    expect(action.imageId).toBe('image-1');
  });
});
