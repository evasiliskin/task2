import { InjectionToken } from '@angular/core';

export type Clock = () => number;

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});
