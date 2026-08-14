import { InjectionToken } from '@angular/core';
import { PolygonInteractionController } from './polygon-interaction-controller';

export const POLYGON_INTERACTION_CONTROLLER = new InjectionToken<PolygonInteractionController>(
  'POLYGON_INTERACTION_CONTROLLER',
  { providedIn: 'root', factory: () => new PolygonInteractionController() },
);
