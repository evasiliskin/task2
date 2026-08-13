import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchResult } from '../../domain/search-result.model';

@Component({
  selector: 'app-search-result-item',
  imports: [],
  templateUrl: './search-result-item.component.html',
  styleUrl: './search-result-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultItem {
  readonly result = input.required<SearchResult>();
  readonly selected = output<void>();
}
