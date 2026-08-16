import { NormalizedPoint } from './normalized-point.model';

export interface Polygon {
  readonly id: string;
  readonly imageId: string;
  readonly points: readonly NormalizedPoint[];
  readonly position: NormalizedPoint;
  readonly rotationRadians: number;
  readonly scale: number;
  readonly createdAt: number;
}
