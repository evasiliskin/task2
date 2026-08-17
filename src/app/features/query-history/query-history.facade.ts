import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { queryHistoryFeature } from './state/query-history.reducer';

@Injectable({ providedIn: 'root' })
export class QueryHistoryFacade {
  private readonly store = inject(Store);

  readonly entries = toSignal(this.store.select(queryHistoryFeature.selectAll), {
    requireSync: true,
  });
}
