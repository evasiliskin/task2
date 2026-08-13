import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';
import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import { PolygonInteractionController } from './polygon-interaction-controller';

describe('PolygonInteractionController', () => {
  const boxSize: CanvasBoxSize = { width: 100, height: 100 };
  const square: Polygon = {
    id: 'image-1',
    imageId: 'image-1',
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
  };

  describe('hitTestBody', () => {
    it('should return true, when the pointer is inside the polygon body', () => {
      const controller = new PolygonInteractionController();
      expect(controller.hitTestBody(square, { x: 50, y: 50 }, boxSize)).toBe(true);
    });

    it('should return false, when the pointer is outside the polygon body', () => {
      const controller = new PolygonInteractionController();
      expect(controller.hitTestBody(square, { x: 5, y: 5 }, boxSize)).toBe(false);
    });
  });

  describe('hitTestRotationHandle', () => {
    it('should return true, when the pointer is within the hit radius of the rotation handle', () => {
      const controller = new PolygonInteractionController();
      expect(controller.hitTestRotationHandle(square, { x: 50, y: 30 }, boxSize)).toBe(true);
    });

    it('should return false, when the pointer is far from the rotation handle', () => {
      const controller = new PolygonInteractionController();
      expect(controller.hitTestRotationHandle(square, { x: 50, y: 90 }, boxSize)).toBe(false);
    });
  });

  describe('isNearFirstDrawPoint', () => {
    const drawPoints: NormalizedPoint[] = [{ x: 0.1, y: 0.1 }];

    it('should return false, when there are no draw points yet', () => {
      const controller = new PolygonInteractionController();
      expect(controller.isNearFirstDrawPoint([], { x: 10, y: 10 }, boxSize)).toBe(false);
    });

    it('should return true, when the pointer is within the hit radius of the first draw point', () => {
      const controller = new PolygonInteractionController();
      expect(controller.isNearFirstDrawPoint(drawPoints, { x: 12, y: 12 }, boxSize)).toBe(true);
    });

    it('should return false, when the pointer is far from the first draw point', () => {
      const controller = new PolygonInteractionController();
      expect(controller.isNearFirstDrawPoint(drawPoints, { x: 90, y: 90 }, boxSize)).toBe(false);
    });
  });

  describe('drag', () => {
    it('should move the polygon position by the pointer delta converted to normalized space, when dragging', () => {
      const controller = new PolygonInteractionController();
      const session = controller.beginDrag(square, { x: 50, y: 50 });

      const updated = controller.updateDrag(session, { x: 60, y: 70 }, boxSize);

      expect(updated.position).toEqual({ x: 0.6, y: 0.7 });
      expect(updated.points).toBe(square.points);
      expect(updated.rotationRadians).toBe(square.rotationRadians);
    });
  });

  describe('rotate', () => {
    it('should keep the rotation unchanged, when the pointer has not moved since beginRotate', () => {
      const controller = new PolygonInteractionController();
      const pointer: PixelPoint = { x: 50, y: 30 };
      const session = controller.beginRotate(square, pointer, boxSize);

      const updated = controller.updateRotate(session, pointer, boxSize);

      expect(updated.rotationRadians).toBeCloseTo(0, 9);
    });

    it('should rotate the polygon by the pointer angle delta around its position, when rotating', () => {
      const controller = new PolygonInteractionController();
      const session = controller.beginRotate(square, { x: 50, y: 30 }, boxSize);

      const updated = controller.updateRotate(session, { x: 70, y: 50 }, boxSize);

      expect(updated.rotationRadians).toBeCloseTo(Math.PI / 2, 9);
      expect(updated.position).toEqual(square.position);
    });
  });
});
