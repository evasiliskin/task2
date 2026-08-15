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

  /**
   * The active query, isolated behind its own `computed` so that reads of it are
   * equality-memoized: only an actual query change bumps its version, unaffected by
   * unrelated `viewModel` churn (e.g. a results batch landing).
   *
   * CORRECTION from the brief: the brief's exact code used
   * `source: () => this.viewModel().activeQuery` inline. An inline function source given to
   * `linkedSignal` is not memoized the way a `computed()` signal is — it re-triggers the
   * `computation` (resetting `lastVisibleRange` to `null`) on *every* `viewModel` write, even
   * when `activeQuery` itself hasn't changed. That silently broke the very feature under
   * test: a results batch landing while the user is stationary is itself a `viewModel`
   * write, so the brief's version reset `lastVisibleRange` to `null` right before the effect
   * could re-evaluate it, and the "batch lands while stationary" test could never pass.
   * Routing through this dedicated `computed` restores real change-only semantics.
   */
  private readonly activeQuery = computed(() => this.viewModel().activeQuery);

  /** Cleared whenever the active query changes, so a stale range cannot trigger a load. */
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
