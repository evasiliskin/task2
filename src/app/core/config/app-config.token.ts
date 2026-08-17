import { InjectionToken } from '@angular/core';
import { appConfig } from './app-config';
import { AppConfig } from './app-config.schema';

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => appConfig,
});
