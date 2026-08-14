import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';
import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import {
  KEYBOARD_NUDGE_STEP,
  KEYBOARD_ROTATION_STEP_RADIANS,
  PolygonInteractionController,
} from './polygon-interaction-controller';

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

    it('should clamp the position, when a drag would push the polygon past the image edge', () => {
      const controller = new PolygonInteractionController();
      const session = controller.beginDrag(square, { x: 50, y: 50 });

      const moved = controller.updateDrag(session, { x: 500, y: 500 }, { width: 100, height: 100 });

      expect(moved.position).toEqual({ x: 1, y: 1 });
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

  describe('nudge', () => {
    it('should move the polygon position by the given normalized delta, leaving points and rotation unchanged', () => {
      const controller = new PolygonInteractionController();

      const updated = controller.nudge(square, { x: 0.02, y: 0 });

      expect(updated.position).toEqual({ x: 0.52, y: 0.5 });
      expect(updated.points).toBe(square.points);
      expect(updated.rotationRadians).toBe(square.rotationRadians);
    });

    it('should clamp the position, when repeated nudges would leave the image', () => {
      const controller = new PolygonInteractionController();
      let polygon = { ...square, position: { x: 0.02, y: 0.5 } };

      polygon = controller.nudge(polygon, { x: -KEYBOARD_NUDGE_STEP, y: 0 });
      polygon = controller.nudge(polygon, { x: -KEYBOARD_NUDGE_STEP, y: 0 });

      expect(polygon.position.x).toBe(0);
    });
  });

  describe('rotateByStep', () => {
    it('should add the given radians to the current rotation, leaving position and points unchanged', () => {
      const controller = new PolygonInteractionController();

      const updated = controller.rotateByStep(square, Math.PI / 12);

      expect(updated.rotationRadians).toBeCloseTo(Math.PI / 12, 9);
      expect(updated.position).toEqual(square.position);
      expect(updated.points).toBe(square.points);
    });

    it('should keep the rotation within one turn, when stepped repeatedly', () => {
      const controller = new PolygonInteractionController();
      let polygon = square;

      for (let i = 0; i < 40; i++) {
        polygon = controller.rotateByStep(polygon, KEYBOARD_ROTATION_STEP_RADIANS);
      }

      expect(polygon.rotationRadians).toBeGreaterThanOrEqual(0);
      expect(polygon.rotationRadians).toBeLessThan(Math.PI * 2);
    });
  });
});
