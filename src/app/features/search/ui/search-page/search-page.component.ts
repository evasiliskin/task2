import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SearchFacade } from '../../search.facade';
import { SearchResult } from '../../domain/search-result.model';
import { SearchViewModel } from '../../state/search.reducer';
import { ImagePreviewDialogService } from '../../../image-editor/ui/image-preview-dialog/image-preview-dialog.service';
import { SearchEmptyState } from '../search-empty-state/search-empty-state.component';
import { SearchErrorState } from '../search-error-state/search-error-state.component';
import { SearchInput } from '../search-input/search-input.component';
import { SearchResultsList } from '../search-results-list/search-results-list.component';

@Component({
  selector: 'app-search-page',
  imports: [SearchInput, SearchResultsList, SearchEmptyState, SearchErrorState, NzSpinModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  private readonly searchFacade = inject(SearchFacade);
  private readonly imagePreviewDialog = inject(ImagePreviewDialogService);

  protected readonly viewModel = toSignal(this.searchFacade.viewModel$, {
    initialValue: {
      results: [],
      status: 'idle',
      error: null,
      activeQuery: null,
      hasMoreResults: false,
      isLoadingMore: false,
      isLoadingMoreError: false,
    } satisfies SearchViewModel,
  });

  protected onRetry(): void {
    this.searchFacade.retry();
  }

  protected onNextPageRequested(): void {
    this.searchFacade.loadNextPage();
  }

  protected onResultSelected(result: SearchResult): void {
    void this.imagePreviewDialog.open({
      imageId: result.id,
      imageUrl: result.imageUrl,
      title: result.title,
      width: result.width,
      height: result.height,
    });
  }
}
