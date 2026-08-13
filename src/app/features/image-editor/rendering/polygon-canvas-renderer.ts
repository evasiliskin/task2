import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import { getRotationHandlePoint } from '../domain/geometry/get-rotation-handle-point';
import { getWorldPoints } from '../domain/geometry/get-world-points';
import { toPixelPoint } from '../domain/geometry/to-pixel-point';
import { Polygon } from '../domain/polygon.model';
import { DEFAULT_POLYGON_RENDER_OPTIONS, PolygonRenderOptions } from './polygon-render-options';

export class PolygonCanvasRenderer {
  render(
    context: CanvasRenderingContext2D,
    polygon: Polygon | null,
    boxSize: CanvasBoxSize,
    options: PolygonRenderOptions = DEFAULT_POLYGON_RENDER_OPTIONS,
  ): void {
    context.save();
    try {
      context.clearRect(0, 0, boxSize.width, boxSize.height);

      if (!polygon) {
        return;
      }

      const aspectRatio = boxSize.width / boxSize.height;
      const pixelPoints = getWorldPoints(polygon, aspectRatio).map((point) =>
        toPixelPoint(point, boxSize),
      );

      this.drawOutline(context, pixelPoints, options);
      this.drawVertices(context, pixelPoints, options);
      this.drawRotationHandle(context, polygon, boxSize, aspectRatio, options);
    } finally {
      context.restore();
    }
  }

  private drawOutline(
    context: CanvasRenderingContext2D,
    pixelPoints: PixelPoint[],
    options: PolygonRenderOptions,
  ): void {
    context.beginPath();
    pixelPoints.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();

    context.fillStyle = options.fillColor;
    context.fill();
    context.strokeStyle = options.strokeColor;
    context.lineWidth = options.lineWidth;
    context.stroke();
  }

  private drawVertices(
    context: CanvasRenderingContext2D,
    pixelPoints: PixelPoint[],
    options: PolygonRenderOptions,
  ): void {
    context.fillStyle = options.strokeColor;
    pixelPoints.forEach((point) => {
      context.beginPath();
      context.arc(point.x, point.y, options.vertexRadius, 0, Math.PI * 2);
      context.fill();
    });
  }

  private drawRotationHandle(
    context: CanvasRenderingContext2D,
    polygon: Polygon,
    boxSize: CanvasBoxSize,
    aspectRatio: number,
    options: PolygonRenderOptions,
  ): void {
    const centroidPixel = toPixelPoint(polygon.position, boxSize);
    const handlePixel = toPixelPoint(getRotationHandlePoint(polygon, aspectRatio), boxSize);

    context.beginPath();
    context.moveTo(centroidPixel.x, centroidPixel.y);
    context.lineTo(handlePixel.x, handlePixel.y);
    context.strokeStyle = options.strokeColor;
    context.stroke();

    context.beginPath();
    context.arc(handlePixel.x, handlePixel.y, options.handleRadius, 0, Math.PI * 2);
    context.fillStyle = options.strokeColor;
    context.fill();
  }
}
