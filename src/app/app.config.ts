import {
  ApplicationConfig,
  EnvironmentProviders,
  importProvidersFrom,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { searchFeature, SearchEffects } from '@search';
import { queryHistoryFeature } from '@query-history';
import { QueryHistoryRecordingEffects } from './shell/query-history-recording.effects';
import { imageEditorFeature } from '@image-editor';
import { provideClientHydration } from '@angular/platform-browser';

registerLocaleData(en);

export function devtoolsProviders(devMode: boolean): EnvironmentProviders[] {
  return devMode ? [provideStoreDevtools({ maxAge: 25, logOnly: false })] : [];
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideStore(),
    provideState(searchFeature),
    provideEffects(SearchEffects),
    provideState(queryHistoryFeature),
    provideEffects(QueryHistoryRecordingEffects),
    provideState(imageEditorFeature),
    ...devtoolsProviders(isDevMode()),
    provideNzI18n(en_US),
    importProvidersFrom(NzModalModule),
    provideClientHydration(),
  ],
};
