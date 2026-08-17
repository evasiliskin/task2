import { appConfig } from '@core/config/app-config';
import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';
import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import { clampPolygonPosition } from '../domain/geometry/clamp-polygon-position';
import { clampPolygonScale } from '../domain/geometry/clamp-polygon-scale';
import { getRotationHandlePixel, getScaleHandlePixels } from '../domain/geometry/get-handle-points';
import { getWorldPoints } from '../domain/geometry/get-world-points';
import { isPointInPolygon } from '../domain/geometry/is-point-in-polygon';
import { normalizeRotation } from '../domain/geometry/normalize-rotation';
import { addPoints } from '../domain/geometry/point-math';
import { toNormalizedPoint } from '../domain/geometry/to-normalized-point';
import { toPixelPoint } from '../domain/geometry/to-pixel-point';

const { rotationHitRadiusPx, scaleHitRadiusPx, drawCloseHitRadiusPx } =
  appConfig.imageEditor.handles;

export interface DragSession {
  readonly polygon: Polygon;
  readonly pointerStart: PixelPoint;
}

export interface RotateSession {
  readonly polygon: Polygon;
  readonly angleOffset: number;
}

export interface ScaleSession {
  readonly polygon: Polygon;
  readonly referenceDistancePx: number;
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
    hitRadiusPx: number = rotationHitRadiusPx,
  ): boolean {
    return pixelDistance(pixelPointer, getRotationHandlePixel(polygon, boxSize)) <= hitRadiusPx;
  }

  hitTestScaleHandle(
    polygon: Polygon,
    pixelPointer: PixelPoint,
    boxSize: CanvasBoxSize,
    hitRadiusPx: number = scaleHitRadiusPx,
  ): number | null {
    const index = getScaleHandlePixels(polygon, boxSize).findIndex(
      (corner) => pixelDistance(pixelPointer, corner) <= hitRadiusPx,
    );
    return index === -1 ? null : index;
  }

  hitTestTopmostBody(
    polygons: readonly Polygon[],
    pixelPointer: PixelPoint,
    boxSize: CanvasBoxSize,
    selected: Polygon | null = null,
  ): Polygon | null {
    if (selected && this.hitTestBody(selected, pixelPointer, boxSize)) {
      return selected;
    }
    for (let index = polygons.length - 1; index >= 0; index--) {
      if (this.hitTestBody(polygons[index], pixelPointer, boxSize)) {
        return polygons[index];
      }
    }
    return null;
  }

  beginScale(polygon: Polygon, handleIndex: number, boxSize: CanvasBoxSize): ScaleSession {
    const centrePixel = toPixelPoint(polygon.position, boxSize);
    const unitCorner = getScaleHandlePixels({ ...polygon, scale: 1 }, boxSize)[handleIndex];
    return { polygon, referenceDistancePx: pixelDistance(unitCorner, centrePixel) };
  }

  updateScale(session: ScaleSession, pixelPointer: PixelPoint, boxSize: CanvasBoxSize): Polygon {
    if (session.referenceDistancePx === 0) {
      return session.polygon;
    }
    const centrePixel = toPixelPoint(session.polygon.position, boxSize);
    return {
      ...session.polygon,
      scale: clampPolygonScale(
        pixelDistance(pixelPointer, centrePixel) / session.referenceDistancePx,
      ),
    };
  }

  nextScale(polygon: Polygon, factor: number): number {
    return clampPolygonScale(polygon.scale * factor);
  }

  isNearFirstDrawPoint(
    drawPoints: readonly NormalizedPoint[],
    pixelPointer: PixelPoint,
    boxSize: CanvasBoxSize,
    hitRadiusPx: number = drawCloseHitRadiusPx,
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

  nextPosition(polygon: Polygon, delta: NormalizedPoint): NormalizedPoint {
    return clampPolygonPosition(addPoints(polygon.position, delta));
  }

  nextRotation(polygon: Polygon, deltaRadians: number): number {
    return normalizeRotation(polygon.rotationRadians + deltaRadians);
  }
}
