import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-search-error-state',
  imports: [NzAlertModule, NzButtonModule],
  templateUrl: './search-error-state.component.html',
  styleUrl: './search-error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchErrorState {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
