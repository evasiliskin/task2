import { NormalizedPoint } from '../normalized-point.model';

export function isPointInPolygon(
  point: NormalizedPoint,
  polygonPoints: readonly NormalizedPoint[],
): boolean {
  let isInside = false;
  const count = polygonPoints.length;

  for (let i = 0, j = count - 1; i < count; j = i++) {
    const vertexI = polygonPoints[i];
    const vertexJ = polygonPoints[j];

    const crossesRay = vertexI.y > point.y !== vertexJ.y > point.y;
    const intersectsAtOrBeforeX =
      crossesRay &&
      point.x <
        ((vertexJ.x - vertexI.x) * (point.y - vertexI.y)) / (vertexJ.y - vertexI.y) + vertexI.x;

    if (intersectsAtOrBeforeX) {
      isInside = !isInside;
    }
  }

  return isInside;
}
