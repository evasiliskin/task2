import { InjectionToken, inject } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';
import { OpenverseApiConfig } from '@core/config/app-config.schema';

export type { OpenverseApiConfig };

export const OPENVERSE_API_CONFIG = new InjectionToken<OpenverseApiConfig>('OPENVERSE_API_CONFIG', {
  providedIn: 'root',
  factory: () => inject(APP_CONFIG).api.openverse,
});
