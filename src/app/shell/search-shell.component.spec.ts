import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideStore, Store } from '@ngrx/store';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ImagePreviewDialogService } from '@image-editor';
import { queryHistoryFeature, QueryHistoryActions, QueryHistoryFacade } from '@query-history';
import {
  searchFeature,
  SearchFacade,
  SearchInput,
  SearchResult,
  SearchResultsList,
  SearchViewModel,
} from '@search';
import { SearchShell } from './search-shell.component';

const fixtureData = {
  result: (overrides: Partial<SearchResult> = {}): SearchResult => ({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'A cat',
    imageUrl: 'https://images.example.org/full.jpg',
    thumbnailUrl: 'https://images.example.org/thumb.jpg',
    width: 1024,
    height: 768,
    creator: null,
    sourceUrl: 'https://images.example.org/source',
    ...overrides,
  }),
  results: (count: number): SearchResult[] =>
    Array.from({ length: count }, (_, index) =>
      fixtureData.result({
        id: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380${(index + 10).toString(16).padStart(3, '0')}`,
      }),
    ),
  viewModel: (overrides: Partial<SearchViewModel> = {}): SearchViewModel => ({
    results: [],
    status: 'idle',
    error: null,
    activeQuery: null,
    hasMoreResults: false,
    isLoadingMore: false,
    isLoadingMoreError: false,
    ...overrides,
  }),
};

function searchInputOf(fixture: ComponentFixture<SearchShell>): SearchInput {
  return fixture.debugElement.query(By.directive(SearchInput)).componentInstance as SearchInput;
}

function resultsListOf(fixture: ComponentFixture<SearchShell>): SearchResultsList {
  return fixture.debugElement.query(By.directive(SearchResultsList))
    .componentInstance as SearchResultsList;
}

describe('SearchShell suggestions', () => {
  function render(): ComponentFixture<SearchShell> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStore({
          [searchFeature.name]: searchFeature.reducer,
          [queryHistoryFeature.name]: queryHistoryFeature.reducer,
        }),
        importProvidersFrom(NzModalModule),
      ],
    });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    return fixture;
  }

  it('should offer the recorded queries, when the query text is empty', () => {
    const fixture = render();

    TestBed.inject(Store).dispatch(
      QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 1 }),
    );
    fixture.detectChanges();

    expect(searchInputOf(fixture).suggestions()).toEqual(['mountains']);
  });

  it('should offer a matching recorded query, when the typed query prefixes it', () => {
    const fixture = render();
    TestBed.inject(Store).dispatch(
      QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 1 }),
    );

    searchInputOf(fixture).queryChange.emit('mou');
    fixture.detectChanges();

    expect(searchInputOf(fixture).suggestions()).toEqual(['mountains']);
  });

  it('should offer no suggestions, when nothing has been recorded yet', () => {
    const fixture = render();

    expect(searchInputOf(fixture).suggestions()).toEqual([]);
  });
});

describe('SearchShell view rendering', () => {
  let facade: {
    viewModel: ReturnType<typeof signal<SearchViewModel>>;
    queryChanged: ReturnType<typeof vi.fn>;
    querySubmitted: ReturnType<typeof vi.fn>;
    loadNextPage: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
  };
  let openPreviewDialog: ReturnType<typeof vi.fn>;

  function render(
    viewModelOverrides: Partial<SearchViewModel> = {},
  ): ComponentFixture<SearchShell> {
    facade = {
      viewModel: signal(fixtureData.viewModel(viewModelOverrides)),
      queryChanged: vi.fn(),
      querySubmitted: vi.fn(),
      loadNextPage: vi.fn(),
      retry: vi.fn(),
    };
    openPreviewDialog = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SearchFacade, useValue: facade },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        { provide: ImagePreviewDialogService, useValue: { open: openPreviewDialog } },
      ],
    });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    return fixture;
  }

  it('should invite the user to start typing, when no search is active', () => {
    const fixture = render({ status: 'idle' });

    expect(fixture.nativeElement.textContent).toContain('Start typing to search');
  });

  it('should announce progress politely, when a search is running', () => {
    const fixture = render({ status: 'loading' });

    const loading = fixture.nativeElement.querySelector('.search-shell__loading');
    expect(loading.getAttribute('aria-live')).toBe('polite');
    expect(loading.textContent).toContain('Searching');
  });

  it('should show the error state, when the search failed', () => {
    const fixture = render({ status: 'error', error: 'offline' });

    expect(fixture.nativeElement.textContent).toContain('Network error');
  });

  it('should retry through the facade, when the error state retry button is clicked', () => {
    const fixture = render({ status: 'error', error: 'offline' });

    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();

    expect(facade.retry).toHaveBeenCalled();
  });

  it('should show the empty state naming the query, when the search succeeded with no results', () => {
    const fixture = render({ status: 'success', activeQuery: 'dinosaurs', results: [] });

    expect(fixture.nativeElement.textContent).toContain('No results for “dinosaurs”');
  });

  it('should show the results, when the search succeeded with results', async () => {
    vi.useFakeTimers();
    const fixture = render({ status: 'success', results: [fixtureData.result()] });

    await vi.advanceTimersByTimeAsync(16);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('A cat');
    vi.useRealTimers();
  });

  it('should show a visually-hidden "Search results" heading, when there are results', () => {
    const fixture = render({ status: 'success', results: [fixtureData.result()] });

    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent.trim()).toBe('Search results');
    expect(heading.classList.contains('visually-hidden')).toBe(true);
  });

  it('should not render the "Search results" heading, when there are no results yet', () => {
    const fixture = render({ status: 'idle' });

    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
  });

  it('should pass the load-more flags down to the results list, when a page fails to load', () => {
    const fixture = render({
      status: 'success',
      results: [fixtureData.result()],
      hasMoreResults: true,
      isLoadingMore: false,
      isLoadingMoreError: true,
    });

    const resultsList = resultsListOf(fixture);
    expect(resultsList.isLoadingMore()).toBe(false);
    expect(resultsList.isLoadingMoreError()).toBe(true);
  });

  it('should retry through the facade, when the results list emits retry', () => {
    const fixture = render({
      status: 'success',
      results: [fixtureData.result()],
      isLoadingMoreError: true,
    });

    resultsListOf(fixture).retry.emit();

    expect(facade.retry).toHaveBeenCalled();
  });

  it('should submit and track the suggestion as the new query, when a suggestion is selected', () => {
    const fixture = render({ status: 'idle' });

    searchInputOf(fixture).suggestionSelected.emit('mountains');
    fixture.detectChanges();

    expect(facade.querySubmitted).toHaveBeenCalledWith('mountains');
    expect(facade.queryChanged).toHaveBeenCalledWith('mountains');
    expect(searchInputOf(fixture).query()).toBe('mountains');
  });

  it('should forward the typed query to the facade, when the input reports a change', () => {
    const fixture = render({ status: 'idle' });

    searchInputOf(fixture).queryChange.emit('cats');
    fixture.detectChanges();

    expect(facade.queryChanged).toHaveBeenCalledWith('cats');
    expect(searchInputOf(fixture).query()).toBe('cats');
  });

  it('should open the preview dialog with the selected image, when a result is selected', () => {
    const selected = fixtureData.result();
    const fixture = render({ status: 'success', results: [selected] });

    resultsListOf(fixture).resultSelected.emit(selected);

    expect(openPreviewDialog).toHaveBeenCalledWith({
      imageId: selected.id,
      imageUrl: selected.imageUrl,
      title: selected.title,
      width: selected.width,
      height: selected.height,
    });
  });

  it('should show an error message, when the preview dialog fails to open', async () => {
    const selected = fixtureData.result();
    const fixture = render({ status: 'success', results: [selected] });
    openPreviewDialog.mockRejectedValue(new Error('chunk load failed'));

    resultsListOf(fixture).resultSelected.emit(selected);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not open the image preview');
  });

  it('should clear the previous dialog error, when another result is selected', async () => {
    const selected = fixtureData.result();
    const fixture = render({ status: 'success', results: [selected] });
    openPreviewDialog.mockRejectedValueOnce(new Error('chunk load failed'));

    resultsListOf(fixture).resultSelected.emit(selected);
    await fixture.whenStable();
    fixture.detectChanges();

    resultsListOf(fixture).resultSelected.emit(selected);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Could not open the image preview');
  });
});

describe('SearchShell pagination', () => {
  let viewModel: ReturnType<typeof signal<SearchViewModel>>;
  let loadNextPage: ReturnType<typeof vi.fn>;

  function render(
    viewModelOverrides: Partial<SearchViewModel> = {},
  ): ComponentFixture<SearchShell> {
    viewModel = signal(fixtureData.viewModel(viewModelOverrides));
    loadNextPage = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: SearchFacade,
          useValue: {
            viewModel,
            queryChanged: vi.fn(),
            querySubmitted: vi.fn(),
            loadNextPage,
            retry: vi.fn(),
          },
        },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        {
          provide: ImagePreviewDialogService,
          useValue: { open: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    return fixture;
  }

  it('should request the next page, when the viewport reaches the end of the loaded results', () => {
    const fixture = render({
      status: 'success',
      results: fixtureData.results(20),
      hasMoreResults: true,
    });

    resultsListOf(fixture).scrolled.emit({ firstVisibleIndex: 15, visibleRowCount: 0 });
    fixture.detectChanges();

    expect(loadNextPage).toHaveBeenCalled();
  });

  it('should not request the next page, when there are no more results', () => {
    const fixture = render({
      status: 'success',
      results: fixtureData.results(20),
      hasMoreResults: false,
    });

    resultsListOf(fixture).scrolled.emit({ firstVisibleIndex: 15, visibleRowCount: 0 });
    fixture.detectChanges();

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('should not request the next page, when a page is already loading', () => {
    const fixture = render({
      status: 'success',
      results: fixtureData.results(20),
      hasMoreResults: true,
      isLoadingMore: true,
    });

    resultsListOf(fixture).scrolled.emit({ firstVisibleIndex: 15, visibleRowCount: 0 });
    fixture.detectChanges();

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('should request another page, when a batch lands while the viewport is still at the end', async () => {
    const fixture = render({
      status: 'success',
      results: fixtureData.results(20),
      hasMoreResults: true,
    });
    resultsListOf(fixture).scrolled.emit({ firstVisibleIndex: 14, visibleRowCount: 6 });
    fixture.detectChanges();
    await fixture.whenStable();
    loadNextPage.mockClear();

    viewModel.set(
      fixtureData.viewModel({
        status: 'success',
        results: fixtureData.results(26),
        hasMoreResults: true,
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadNextPage).toHaveBeenCalled();
  });

  it('should not request a page, when the active query changed after the last scroll', () => {
    const fixture = render({
      status: 'success',
      results: fixtureData.results(20),
      hasMoreResults: true,
      activeQuery: 'cats',
    });
    resultsListOf(fixture).scrolled.emit({ firstVisibleIndex: 14, visibleRowCount: 6 });
    fixture.detectChanges();
    loadNextPage.mockClear();

    viewModel.set(
      fixtureData.viewModel({
        status: 'success',
        results: fixtureData.results(20),
        hasMoreResults: true,
        activeQuery: 'dogs',
      }),
    );
    fixture.detectChanges();

    expect(loadNextPage).not.toHaveBeenCalled();
  });
});
