import { InjectionToken } from '@angular/core';

export interface OpenverseApiConfig {
  readonly baseUrl: string;
}

export const OPENVERSE_API_CONFIG = new InjectionToken<OpenverseApiConfig>('OPENVERSE_API_CONFIG', {
  factory: () => ({ baseUrl: 'https://api.openverse.org/v1' }),
});

export const SEARCH_RESULTS_PAGE_SIZE = 20;
