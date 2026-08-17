import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { APP_CONFIG } from '@core/config/app-config.token';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultItem } from '../search-result-item/search-result-item.component';
import { VirtualListSemantics } from './virtual-list-semantics.directive';

export interface VisibleRange {
  readonly firstVisibleIndex: number;
  readonly visibleRowCount: number;
}

@Component({
  selector: 'app-search-results-list',
  imports: [
    ScrollingModule,
    NzButtonModule,
    NzSpinModule,
    NzAlertModule,
    SearchResultItem,
    VirtualListSemantics,
  ],
  templateUrl: './search-results-list.component.html',
  styleUrl: './search-results-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--search-result-row-height]': 'rowHeightStyle',
  },
})
export class SearchResultsList {
  readonly results = input.required<readonly SearchResult[]>();
  readonly isLoadingMore = input(false);
  readonly isLoadingMoreError = input(false);

  readonly resultSelected = output<SearchResult>();
  readonly scrolled = output<VisibleRange>();
  readonly retry = output<void>();

  protected readonly rowHeightPx = inject(APP_CONFIG).search.results.rowHeightPx;
  protected readonly rowHeightStyle = `${this.rowHeightPx}px`;

  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  protected trackById(_index: number, result: SearchResult): string {
    return result.id;
  }

  protected onScrolledIndexChange(firstVisibleIndex: number): void {
    const viewportSize = this.viewport()?.getViewportSize() ?? 0;
    this.scrolled.emit({
      firstVisibleIndex,
      visibleRowCount: Math.ceil(viewportSize / this.rowHeightPx),
    });
  }
}
