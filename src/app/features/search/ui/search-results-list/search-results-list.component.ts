import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  SEARCH_RESULT_ROW_HEIGHT_PX,
  shouldLoadNextPage,
} from '../../domain/should-load-next-page';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultItem } from '../search-result-item/search-result-item.component';

@Component({
  selector: 'app-search-results-list',
  imports: [ScrollingModule, NzButtonModule, NzSpinModule, NzAlertModule, SearchResultItem],
  templateUrl: './search-results-list.component.html',
  styleUrl: './search-results-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--search-result-row-height]': 'rowHeightPx + "px"',
  },
})
export class SearchResultsList {
  readonly results = input.required<readonly SearchResult[]>();
  readonly hasMoreResults = input(false);
  readonly isLoadingMore = input(false);
  readonly isLoadingMoreError = input(false);

  readonly resultSelected = output<SearchResult>();
  readonly nextPageRequested = output<void>();
  readonly retry = output<void>();

  protected readonly rowHeightPx = SEARCH_RESULT_ROW_HEIGHT_PX;

  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  protected trackById(_index: number, result: SearchResult): string {
    return result.id;
  }

  protected onScrolledIndexChange(firstVisibleIndex: number): void {
    const viewportSize = this.viewport()?.getViewportSize() ?? 0;
    const visibleRowCount = Math.ceil(viewportSize / SEARCH_RESULT_ROW_HEIGHT_PX);

    const shouldLoad = shouldLoadNextPage({
      firstVisibleIndex,
      visibleRowCount,
      loadedCount: this.results().length,
      hasMoreResults: this.hasMoreResults(),
      isLoadingMore: this.isLoadingMore(),
      isLoadingMoreError: this.isLoadingMoreError(),
    });

    if (shouldLoad) {
      this.nextPageRequested.emit();
    }
  }
}
