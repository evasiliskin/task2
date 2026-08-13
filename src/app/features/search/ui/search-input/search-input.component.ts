import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { QueryHistoryFacade } from '../../../query-history/query-history.facade';
import { suggestionsFor } from '../../../query-history/domain/suggestions-for';
import { SearchFacade } from '../../search.facade';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule, NzInputModule, NzAutocompleteModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  private readonly searchFacade = inject(SearchFacade);
  private readonly queryHistoryFacade = inject(QueryHistoryFacade);

  protected readonly queryText = signal('');
  protected readonly suggestions = computed(() =>
    suggestionsFor(this.queryText(), this.queryHistoryFacade.entries()),
  );

  protected onQueryChange(value: string): void {
    this.queryText.set(value);
    this.searchFacade.search(value);
  }
}
