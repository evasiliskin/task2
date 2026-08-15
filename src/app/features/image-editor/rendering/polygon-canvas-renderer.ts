import { CanvasBoxSize, PixelPoint } from '../domain/geometry/coordinate-mapping.model';
import { getRotationHandlePixel, getScaleHandlePixels } from '../domain/geometry/get-handle-points';
import { getWorldPoints } from '../domain/geometry/get-world-points';
import { toPixelPoint } from '../domain/geometry/to-pixel-point';
import { NormalizedPoint } from '../domain/normalized-point.model';
import { Polygon } from '../domain/polygon.model';
import { DEFAULT_POLYGON_RENDER_OPTIONS, PolygonRenderOptions } from './polygon-render-options';

export class PolygonCanvasRenderer {
  render(
    context: CanvasRenderingContext2D,
    polygons: readonly Polygon[],
    selectedId: string | null,
    boxSize: CanvasBoxSize,
    options: PolygonRenderOptions = DEFAULT_POLYGON_RENDER_OPTIONS,
  ): void {
    context.save();
    try {
      context.clearRect(0, 0, boxSize.width, boxSize.height);

      const aspectRatio = boxSize.width / boxSize.height;
      const selected = polygons.find((polygon) => polygon.id === selectedId) ?? null;

      for (const polygon of polygons) {
        if (polygon === selected) {
          continue;
        }
        this.drawOutline(
          context,
          getWorldPoints(polygon, aspectRatio).map((point) => toPixelPoint(point, boxSize)),
          { ...options, strokeColor: options.mutedStrokeColor, fillColor: 'transparent' },
        );
      }

      if (!selected) {
        return;
      }

      const pixelPoints = getWorldPoints(selected, aspectRatio).map((point) =>
        toPixelPoint(point, boxSize),
      );
      this.drawOutline(context, pixelPoints, options);
      this.drawVertices(context, pixelPoints, options);
      this.drawRotationHandle(context, selected, boxSize, options);
      this.drawScaleHandles(context, selected, boxSize, options);
    } finally {
      context.restore();
    }
  }

  private drawScaleHandles(
    context: CanvasRenderingContext2D,
    polygon: Polygon,
    boxSize: CanvasBoxSize,
    options: PolygonRenderOptions,
  ): void {
    context.fillStyle = options.strokeColor;
    for (const corner of getScaleHandlePixels(polygon, boxSize)) {
      context.beginPath();
      context.rect(
        corner.x - options.handleRadius,
        corner.y - options.handleRadius,
        options.handleRadius * 2,
        options.handleRadius * 2,
      );
      context.fill();
    }
  }

  /**
   * Draws the in-progress draw-mode point/line preview. Unlike `render()`, this does NOT clear
   * the canvas first — callers are expected to have already painted the base frame (e.g. the
   * committed polygons via `render()`) so the preview layers on top of it instead of wiping it.
   */
  renderDrawPreview(
    context: CanvasRenderingContext2D,
    points: readonly NormalizedPoint[],
    boxSize: CanvasBoxSize,
    options: PolygonRenderOptions = DEFAULT_POLYGON_RENDER_OPTIONS,
  ): void {
    context.save();
    try {
      if (points.length === 0) {
        return;
      }

      const pixelPoints = points.map((point) => toPixelPoint(point, boxSize));

      context.beginPath();
      pixelPoints.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.strokeStyle = options.strokeColor;
      context.lineWidth = options.lineWidth;
      context.stroke();

      this.drawVertices(context, pixelPoints, options);
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
    options: PolygonRenderOptions,
  ): void {
    const centroidPixel = toPixelPoint(polygon.position, boxSize);
    const handlePixel = getRotationHandlePixel(polygon, boxSize);

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
