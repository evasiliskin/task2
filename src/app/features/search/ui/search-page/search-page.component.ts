import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SearchFacade } from '../../search.facade';
import { SearchResult } from '../../domain/search-result.model';
import { ImageEditorFacade } from '../../../image-editor/image-editor.facade';
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
  protected readonly searchFacade = inject(SearchFacade);
  private readonly imageEditorFacade = inject(ImageEditorFacade);

  protected readonly results = toSignal(this.searchFacade.results$, {
    initialValue: [] as SearchResult[],
  });
  protected readonly status = toSignal(this.searchFacade.status$, { initialValue: 'idle' });
  protected readonly error = toSignal(this.searchFacade.error$, { initialValue: null });
  protected readonly activeQuery = toSignal(this.searchFacade.activeQuery$, {
    initialValue: null,
  });
  protected readonly hasMoreResults = toSignal(this.searchFacade.hasMoreResults$, {
    initialValue: false,
  });
  protected readonly isLoadingMore = toSignal(this.searchFacade.isLoadingMore$, {
    initialValue: false,
  });
  protected readonly isLoadingMoreError = toSignal(this.searchFacade.isLoadingMoreError$, {
    initialValue: false,
  });

  protected onRetry(): void {
    this.searchFacade.retry();
  }

  protected onNextPageRequested(): void {
    this.searchFacade.loadNextPage();
  }

  protected onResultSelected(result: SearchResult): void {
    void this.imageEditorFacade.open({
      imageId: result.id,
      imageUrl: result.imageUrl,
      title: result.title,
    });
  }
}
