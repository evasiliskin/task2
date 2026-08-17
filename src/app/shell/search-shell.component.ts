import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import {
  SearchEmptyState,
  SearchErrorState,
  SearchFacade,
  SearchInput,
  SearchResult,
  SearchResultsList,
  shouldLoadNextPage,
  VisibleRange,
} from '@search';
import { QueryHistoryFacade, suggestionsFor } from '@query-history';
import { ImagePreviewDialogService } from '@image-editor';

@Component({
  selector: 'app-search-shell',
  imports: [
    SearchInput,
    SearchResultsList,
    SearchEmptyState,
    SearchErrorState,
    NzSpinModule,
    NzAlertModule,
  ],
  templateUrl: './search-shell.component.html',
  styleUrl: './search-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchShell {
  private readonly searchFacade = inject(SearchFacade);
  private readonly queryHistoryFacade = inject(QueryHistoryFacade);
  private readonly imagePreviewDialog = inject(ImagePreviewDialogService);

  protected readonly queryText = signal('');
  protected readonly dialogFailed = signal(false);

  protected readonly viewModel = this.searchFacade.viewModel;

  protected readonly suggestions = computed(() =>
    suggestionsFor(this.queryText(), this.queryHistoryFacade.entries()),
  );

  protected readonly searchAnnouncement = computed(() => {
    const viewModel = this.viewModel();
    if (viewModel.status !== 'success' || viewModel.activeQuery === null) {
      return '';
    }
    if (viewModel.results.length === 0) {
      return `No results for ${viewModel.activeQuery}.`;
    }
    const noun = viewModel.results.length === 1 ? 'result' : 'results';
    return `${viewModel.results.length} ${noun} loaded for ${viewModel.activeQuery}.`;
  });

  private readonly activeQuery = computed(() => this.viewModel().activeQuery);

  private readonly lastVisibleRange = linkedSignal<string | null, VisibleRange | null>({
    source: this.activeQuery,
    computation: () => null,
  });

  constructor() {
    effect(() => {
      const range = this.lastVisibleRange();
      if (!range) {
        return;
      }

      const viewModel = this.viewModel();
      const shouldLoad = shouldLoadNextPage({
        firstVisibleIndex: range.firstVisibleIndex,
        visibleRowCount: range.visibleRowCount,
        loadedCount: viewModel.results.length,
        hasMoreResults: viewModel.hasMoreResults,
        isLoadingMore: viewModel.isLoadingMore,
        isLoadingMoreError: viewModel.isLoadingMoreError,
      });

      if (shouldLoad) {
        this.searchFacade.loadNextPage();
      }
    });
  }

  protected onQueryChange(value: string): void {
    this.queryText.set(value);
    this.searchFacade.queryChanged(value);
  }

  protected onSuggestionSelected(query: string): void {
    this.queryText.set(query);
    this.searchFacade.querySubmitted(query);
    this.searchFacade.queryChanged(query);
  }

  protected onRetry(): void {
    this.searchFacade.retry();
  }

  protected onScrolled(range: VisibleRange): void {
    this.lastVisibleRange.set(range);
  }

  protected onResultSelected(result: SearchResult): void {
    this.dialogFailed.set(false);
    this.imagePreviewDialog
      .open({
        imageId: result.id,
        imageUrl: result.imageUrl,
        title: result.title,
        width: result.width,
        height: result.height,
      })
      .catch(() => this.dialogFailed.set(true));
  }
}
