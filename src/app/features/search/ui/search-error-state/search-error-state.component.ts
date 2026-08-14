import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SearchErrorKind } from '../../state/to-search-error-kind';
import { searchErrorMessage } from '../search-error-message';

@Component({
  selector: 'app-search-error-state',
  imports: [NzAlertModule, NzButtonModule],
  templateUrl: './search-error-state.component.html',
  styleUrl: './search-error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchErrorState {
  readonly errorKind = input.required<SearchErrorKind | null>();
  readonly retry = output<void>();

  protected readonly message = computed(() => searchErrorMessage(this.errorKind() ?? 'unknown'));
}
