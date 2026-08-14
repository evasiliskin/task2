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
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { searchFeature } from './features/search/state/search.reducer';
import { SearchEffects } from './features/search/state/search.effects';
import { queryHistoryFeature } from './features/query-history/state/query-history.reducer';
import { QueryHistoryEffects } from './features/query-history/state/query-history.effects';
import { imageEditorFeature } from './features/image-editor/state/image-editor.reducer';

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
    provideEffects(QueryHistoryEffects),
    provideState(imageEditorFeature),
    ...devtoolsProviders(isDevMode()),
    provideNzI18n(en_US),
    provideNzDateFnsAdapter(),
    importProvidersFrom(NzModalModule),
  ],
};
