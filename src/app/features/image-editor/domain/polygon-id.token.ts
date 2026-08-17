import { InjectionToken } from '@angular/core';

export type PolygonIdFactory = () => string;

function createFallbackIdFactory(): PolygonIdFactory {
  let sequence = 0;
  return () => `polygon-${(sequence += 1)}`;
}

export const POLYGON_ID = new InjectionToken<PolygonIdFactory>('POLYGON_ID', {
  providedIn: 'root',
  factory: () => {
    const fallback = createFallbackIdFactory();
    return () => globalThis.crypto?.randomUUID?.() ?? fallback();
  },
});
