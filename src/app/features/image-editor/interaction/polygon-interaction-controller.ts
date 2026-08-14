import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';
import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import { clampPolygonPosition } from '../domain/geometry/clamp-polygon-position';
import { getRotationHandlePoint } from '../domain/geometry/get-rotation-handle-point';
import { getWorldPoints } from '../domain/geometry/get-world-points';
import { isPointInPolygon } from '../domain/geometry/is-point-in-polygon';
import { normalizeRotation } from '../domain/geometry/normalize-rotation';
import { addPoints } from '../domain/geometry/point-math';
import { toNormalizedPoint } from '../domain/geometry/to-normalized-point';
import { toPixelPoint } from '../domain/geometry/to-pixel-point';

export const ROTATION_HANDLE_HIT_RADIUS_PX = 12;
export const DRAW_CLOSE_HIT_RADIUS_PX = 10;
export const KEYBOARD_NUDGE_STEP = 0.02;
export const KEYBOARD_ROTATION_STEP_RADIANS = Math.PI / 12;

export interface DragSession {
  readonly polygon: Polygon;
  readonly pointerStart: PixelPoint;
}

export interface RotateSession {
  readonly polygon: Polygon;
  readonly angleOffset: number;
}

function subtractPixelPoints(a: PixelPoint, b: PixelPoint): PixelPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

function pixelDistance(a: PixelPoint, b: PixelPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pixelAngle(point: PixelPoint, center: PixelPoint): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

export class PolygonInteractionController {
  hitTestBody(polygon: Polygon, pixelPointer: PixelPoint, boxSize: CanvasBoxSize): boolean {
    const aspectRatio = boxSize.width / boxSize.height;
    const pixelWorldPoints = getWorldPoints(polygon, aspectRatio).map((point) =>
      toPixelPoint(point, boxSize),
    );
    return isPointInPolygon(pixelPointer, pixelWorldPoints);
  }

  hitTestRotationHandle(
    polygon: Polygon,
    pixelPointer: PixelPoint,
    boxSize: CanvasBoxSize,
    hitRadiusPx: number = ROTATION_HANDLE_HIT_RADIUS_PX,
  ): boolean {
    const aspectRatio = boxSize.width / boxSize.height;
    const handlePixel = toPixelPoint(getRotationHandlePoint(polygon, aspectRatio), boxSize);
    return pixelDistance(pixelPointer, handlePixel) <= hitRadiusPx;
  }

  isNearFirstDrawPoint(
    drawPoints: readonly NormalizedPoint[],
    pixelPointer: PixelPoint,
    boxSize: CanvasBoxSize,
    hitRadiusPx: number = DRAW_CLOSE_HIT_RADIUS_PX,
  ): boolean {
    if (drawPoints.length === 0) {
      return false;
    }
    const firstPixel = toPixelPoint(drawPoints[0], boxSize);
    return pixelDistance(pixelPointer, firstPixel) <= hitRadiusPx;
  }

  beginDrag(polygon: Polygon, pixelPointer: PixelPoint): DragSession {
    return { polygon, pointerStart: pixelPointer };
  }

  updateDrag(session: DragSession, pixelPointer: PixelPoint, boxSize: CanvasBoxSize): Polygon {
    const pixelDelta = subtractPixelPoints(pixelPointer, session.pointerStart);
    const normalizedDelta = toNormalizedPoint(pixelDelta, boxSize);
    return {
      ...session.polygon,
      position: clampPolygonPosition(addPoints(session.polygon.position, normalizedDelta)),
    };
  }

  beginRotate(polygon: Polygon, pixelPointer: PixelPoint, boxSize: CanvasBoxSize): RotateSession {
    const centerPixel = toPixelPoint(polygon.position, boxSize);
    return {
      polygon,
      angleOffset: pixelAngle(pixelPointer, centerPixel) - polygon.rotationRadians,
    };
  }

  updateRotate(session: RotateSession, pixelPointer: PixelPoint, boxSize: CanvasBoxSize): Polygon {
    const centerPixel = toPixelPoint(session.polygon.position, boxSize);
    const currentAngle = pixelAngle(pixelPointer, centerPixel);
    return {
      ...session.polygon,
      rotationRadians: normalizeRotation(currentAngle - session.angleOffset),
    };
  }

  nudge(polygon: Polygon, delta: NormalizedPoint): Polygon {
    return { ...polygon, position: clampPolygonPosition(addPoints(polygon.position, delta)) };
  }

  rotateByStep(polygon: Polygon, deltaRadians: number): Polygon {
    return { ...polygon, rotationRadians: normalizeRotation(polygon.rotationRadians + deltaRadians) };
  }
}
