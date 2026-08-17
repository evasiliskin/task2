import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-search-empty-state',
  imports: [NzEmptyModule],
  templateUrl: './search-empty-state.component.html',
  styleUrl: './search-empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchEmptyState {
  readonly query = input.required<string>();

  protected readonly message = computed(
    () => `No results for “${this.query()}”. Try a different search.`,
  );
}
