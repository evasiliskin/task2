import { InjectionToken } from '@angular/core';

export type PolygonIdFactory = () => string;

/**
 * `crypto.randomUUID` is only defined in a secure context, so it is absent when the app is
 * served over plain HTTP from a non-localhost origin. The counter fallback keeps polygon ids
 * unique within the session, which is all the in-memory store requires.
 */
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
