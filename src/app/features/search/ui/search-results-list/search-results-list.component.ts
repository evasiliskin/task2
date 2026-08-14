import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultItem } from '../search-result-item/search-result-item.component';

const NEAR_END_THRESHOLD = 8;

@Component({
  selector: 'app-search-results-list',
  imports: [ScrollingModule, NzButtonModule, NzSpinModule, NzAlertModule, SearchResultItem],
  templateUrl: './search-results-list.component.html',
  styleUrl: './search-results-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsList {
  readonly results = input.required<readonly SearchResult[]>();
  readonly hasMoreResults = input(false);
  readonly isLoadingMore = input(false);
  readonly isLoadingMoreError = input(false);

  readonly resultSelected = output<SearchResult>();
  readonly nextPageRequested = output<void>();
  readonly retry = output<void>();

  protected trackById(_index: number, result: SearchResult): string {
    return result.id;
  }

  protected onScrolledIndexChange(renderedIndex: number): void {
    const remaining = this.results().length - renderedIndex;
    const canLoadMore =
      this.hasMoreResults() && !this.isLoadingMore() && !this.isLoadingMoreError();
    if (canLoadMore && remaining <= NEAR_END_THRESHOLD) {
      this.nextPageRequested.emit();
    }
  }
}
