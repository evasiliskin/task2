import { InjectionToken } from '@angular/core';

export type PolygonIdFactory = () => string;

export const POLYGON_ID = new InjectionToken<PolygonIdFactory>('POLYGON_ID', {
  providedIn: 'root',
  factory: () => () => crypto.randomUUID(),
});
