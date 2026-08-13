import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
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
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { searchFeature } from './features/search/state/search.reducer';
import { SearchEffects } from './features/search/state/search.effects';
import { queryHistoryFeature } from './features/query-history/state/query-history.reducer';
import { QueryHistoryEffects } from './features/query-history/state/query-history.effects';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideStore(),
    provideEffects(),
    provideState(searchFeature),
    provideEffects(SearchEffects),
    provideState(queryHistoryFeature),
    provideEffects(QueryHistoryEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideNzI18n(en_US),
    provideNzDateFnsAdapter(),
  ],
};
