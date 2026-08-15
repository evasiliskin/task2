import { TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideStore, Store } from '@ngrx/store';
import { By } from '@angular/platform-browser';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  searchFeature,
  SearchFacade,
  SearchResult,
  SearchResultsList,
  SearchViewModel,
} from '@search';
import { queryHistoryFeature, QueryHistoryActions, QueryHistoryFacade } from '@query-history';
import { ImagePreviewDialogService } from '@image-editor';
import { SearchShell } from './search-shell.component';

describe('SearchShell', () => {
  function setup() {
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
    return TestBed.createComponent(SearchShell);
  }

  it('should expose recent-query suggestions, when the query text is empty', () => {
    const fixture = setup();
    TestBed.inject(Store).dispatch(
      QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 1 }),
    );
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      suggestions: () => readonly string[];
    };
    expect(component.suggestions()).toEqual(['mountains']);
  });

  it('should expose a matching history suggestion, when the typed query prefixes a recorded query', () => {
    const fixture = setup();
    TestBed.inject(Store).dispatch(
      QueryHistoryActions.queryRecorded({ query: 'mountains', usedAt: 1 }),
    );
    const component = fixture.componentInstance as unknown as {
      suggestions: () => readonly string[];
      onQueryChange: (value: string) => void;
    };
    component.onQueryChange('mou');
    fixture.detectChanges();
    expect(component.suggestions()).toEqual(['mountains']);
  });
});

function makeFacadeStub(overrides: Partial<SearchViewModel> = {}) {
  const viewModel: SearchViewModel = {
    results: [],
    status: 'idle',
    error: null,
    activeQuery: null,
    hasMoreResults: false,
    isLoadingMore: false,
    isLoadingMoreError: false,
    ...overrides,
  };

  return {
    viewModel: signal(viewModel),
    queryChanged: vi.fn(),
    loadNextPage: vi.fn(),
    retry: vi.fn(),
  };
}

const noResult: SearchResult = {
  id: '1',
  title: 'A cat',
  imageUrl: '',
  thumbnailUrl: '',
  width: 0,
  height: 0,
  creator: null,
  sourceUrl: '',
};

describe('SearchShell view rendering', () => {
  function configure(facadeOverrides: Partial<SearchViewModel> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SearchFacade, useValue: makeFacadeStub(facadeOverrides) },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        {
          provide: ImagePreviewDialogService,
          useValue: { open: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
  }

  it('should invite the user to start typing, when no search is active', () => {
    configure({ status: 'idle', results: [] });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Start typing to search');
  });

  it('shows the error state and retries via the facade', () => {
    configure({ status: 'error', error: 'offline' });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Network error');

    const facade = TestBed.inject(SearchFacade);
    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(facade.retry).toHaveBeenCalled();
  });

  it('shows the empty state for a successful search with zero results', () => {
    configure({ status: 'success', activeQuery: 'dinosaurs', results: [] });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('dinosaurs');
  });

  it('shows results for a successful search with results', async () => {
    configure({ status: 'success', results: [noResult], hasMoreResults: true });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.textContent).toContain('A cat');
  });

  it('adds a visually-hidden "Search results" heading above the results region, once there are results', async () => {
    configure({ status: 'success', results: [noResult], hasMoreResults: true });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Search results');
    expect(heading?.classList.contains('visually-hidden')).toBe(true);
  });

  it('does not render the "Search results" heading before there are results', () => {
    configure({ status: 'idle' });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
  });

  it('passes isLoadingMore and isLoadingMoreError through to the results list, without hasMoreResults', () => {
    configure({
      status: 'success',
      results: [noResult],
      hasMoreResults: true,
      isLoadingMore: false,
      isLoadingMoreError: true,
    });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    expect(resultsList).toBeTruthy();
    const resultsListInstance = resultsList.componentInstance as SearchResultsList;

    expect(resultsListInstance.isLoadingMore()).toBe(false);
    expect(resultsListInstance.isLoadingMoreError()).toBe(true);
  });

  it('wires the results list retry output to the facade retry', () => {
    configure({
      status: 'success',
      results: [noResult],
      hasMoreResults: true,
      isLoadingMoreError: true,
    });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    (resultsList.componentInstance as SearchResultsList).retry.emit();

    const facade = TestBed.inject(SearchFacade);
    expect(facade.retry).toHaveBeenCalled();
  });

  it('opens the image editor dialog via the facade, when a result is selected', () => {
    const selected: SearchResult = { ...noResult, imageUrl: 'https://x/full.jpg' };
    configure({ status: 'success', results: [selected], hasMoreResults: true });
    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    (resultsList.componentInstance as SearchResultsList).resultSelected.emit(selected);

    const imagePreviewDialog = TestBed.inject(ImagePreviewDialogService);
    expect(imagePreviewDialog.open).toHaveBeenCalledWith({
      imageId: '1',
      imageUrl: 'https://x/full.jpg',
      title: 'A cat',
      width: 0,
      height: 0,
    });
  });

  it('should show a visible error message, when opening the image editor dialog fails', async () => {
    const selected: SearchResult = { ...noResult, imageUrl: 'https://x/full.jpg' };
    configure({ status: 'success', results: [selected], hasMoreResults: true });
    const imagePreviewDialog = TestBed.inject(ImagePreviewDialogService);
    const openError = new Error('failed to open dialog');
    (imagePreviewDialog.open as ReturnType<typeof vi.fn>).mockRejectedValue(openError);

    const fixture = TestBed.createComponent(SearchShell);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    (resultsList.componentInstance as SearchResultsList).resultSelected.emit(selected);

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not open the image preview');
  });
});

describe('SearchShell pagination decision', () => {
  function configure(facadeOverrides: Partial<SearchViewModel> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SearchFacade, useValue: makeFacadeStub(facadeOverrides) },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        {
          provide: ImagePreviewDialogService,
          useValue: { open: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
    return TestBed.createComponent(SearchShell);
  }

  it('requests the next page via the facade when shouldLoadNextPage is satisfied', () => {
    const fixture = configure({
      status: 'success',
      results: Array.from({ length: 20 }, (_, i) => ({ ...noResult, id: `${i}` })),
      hasMoreResults: true,
      isLoadingMore: false,
      isLoadingMoreError: false,
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      onScrolled: (range: { firstVisibleIndex: number; visibleRowCount: number }) => void;
    };
    component.onScrolled({ firstVisibleIndex: 15, visibleRowCount: 0 });
    fixture.detectChanges();

    const facade = TestBed.inject(SearchFacade);
    expect(facade.loadNextPage).toHaveBeenCalled();
  });

  it('does not request the next page when shouldLoadNextPage is not satisfied', () => {
    const fixture = configure({
      status: 'success',
      results: Array.from({ length: 20 }, (_, i) => ({ ...noResult, id: `${i}` })),
      hasMoreResults: false,
      isLoadingMore: false,
      isLoadingMoreError: false,
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      onScrolled: (range: { firstVisibleIndex: number; visibleRowCount: number }) => void;
    };
    component.onScrolled({ firstVisibleIndex: 15, visibleRowCount: 0 });

    const facade = TestBed.inject(SearchFacade);
    expect(facade.loadNextPage).not.toHaveBeenCalled();
  });

  it('does not request the next page while a page is already loading', () => {
    const fixture = configure({
      status: 'success',
      results: Array.from({ length: 20 }, (_, i) => ({ ...noResult, id: `${i}` })),
      hasMoreResults: true,
      isLoadingMore: true,
      isLoadingMoreError: false,
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      onScrolled: (range: { firstVisibleIndex: number; visibleRowCount: number }) => void;
    };
    component.onScrolled({ firstVisibleIndex: 15, visibleRowCount: 0 });

    const facade = TestBed.inject(SearchFacade);
    expect(facade.loadNextPage).not.toHaveBeenCalled();
  });
});

describe('SearchShell reactive pagination and dialog failure', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SearchShell>>;
  let component: SearchShell & {
    onScrolled: (range: { firstVisibleIndex: number; visibleRowCount: number }) => void;
    onResultSelected: (result: SearchResult) => void;
  };
  let viewModelSignal: ReturnType<typeof signal<SearchViewModel>>;
  let loadNextPage: ReturnType<typeof vi.fn>;
  let openDialog: ReturnType<typeof vi.fn>;

  function setViewModel(overrides: Partial<SearchViewModel>): void {
    viewModelSignal.set({
      results: [],
      status: 'idle',
      error: null,
      activeQuery: null,
      hasMoreResults: false,
      isLoadingMore: false,
      isLoadingMoreError: false,
      ...overrides,
    });
  }

  function resultsOfLength(length: number): SearchResult[] {
    return Array.from({ length }, (_, i) => ({ ...noResult, id: `${i}` }));
  }

  function aResult(): SearchResult {
    return { ...noResult, imageUrl: 'https://x/full.jpg' };
  }

  beforeEach(() => {
    viewModelSignal = signal<SearchViewModel>({
      results: [],
      status: 'idle',
      error: null,
      activeQuery: null,
      hasMoreResults: false,
      isLoadingMore: false,
      isLoadingMoreError: false,
    });
    loadNextPage = vi.fn();
    openDialog = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: SearchFacade,
          useValue: {
            viewModel: viewModelSignal,
            queryChanged: vi.fn(),
            loadNextPage,
            retry: vi.fn(),
          },
        },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        { provide: ImagePreviewDialogService, useValue: { open: openDialog } },
      ],
    });

    fixture = TestBed.createComponent(SearchShell);
    component = fixture.componentInstance as unknown as typeof component;
  });

  // CORRECTED from the brief: the brief's literal test grew results from 20 to 40 while
  // keeping the same {firstVisibleIndex: 14, visibleRowCount: 6} range. With
  // shouldLoadNextPage's actual formula (lastVisibleIndex = firstVisibleIndex +
  // visibleRowCount = 20; loadedCount - lastVisibleIndex <= 8 rows to trigger), growing to
  // 40 results makes the gap 20, which is well outside the 8-row prefetch window — so a
  // *correct* implementation would legitimately NOT reload, and the brief's test could never
  // pass. This version grows the batch by a small increment (20 -> 26) that keeps the
  // still-stationary viewport within the prefetch window, which is what actually
  // discriminates "re-checked via the effect when a batch lands" from "only checked on
  // scroll" (the pre-fix code would never re-fire here, since onScrolled is not called again).
  it('should request the next page, when a batch lands while the viewport is already at the end', async () => {
    setViewModel({ results: resultsOfLength(20), status: 'success', hasMoreResults: true });
    fixture.detectChanges();
    component.onScrolled({ firstVisibleIndex: 14, visibleRowCount: 6 });
    fixture.detectChanges();
    await Promise.resolve();
    loadNextPage.mockClear();

    setViewModel({ results: resultsOfLength(26), status: 'success', hasMoreResults: true });
    fixture.detectChanges();
    await Promise.resolve();

    expect(loadNextPage).toHaveBeenCalled();
  });

  it('should not request a page, when the active query changed after the last scroll', () => {
    setViewModel({
      results: resultsOfLength(20),
      status: 'success',
      hasMoreResults: true,
      activeQuery: 'cats',
    });
    fixture.detectChanges();
    component.onScrolled({ firstVisibleIndex: 14, visibleRowCount: 6 });
    fixture.detectChanges();
    loadNextPage.mockClear();

    setViewModel({
      results: resultsOfLength(20),
      status: 'success',
      hasMoreResults: true,
      activeQuery: 'dogs',
    });
    fixture.detectChanges();

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('should show an error, when the preview dialog fails to open', async () => {
    openDialog.mockRejectedValue(new Error('chunk load failed'));
    fixture.detectChanges();

    component.onResultSelected(aResult());
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not open the image preview');
  });
});
