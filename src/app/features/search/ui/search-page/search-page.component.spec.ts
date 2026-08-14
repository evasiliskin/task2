import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SearchPage } from './search-page.component';
import { SearchFacade } from '../../search.facade';
import { QueryHistoryFacade } from '../../../query-history/query-history.facade';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultsList } from '../search-results-list/search-results-list.component';
import { ImagePreviewDialogService } from '../../../image-editor/ui/image-preview-dialog/image-preview-dialog.service';

function makeFacadeStub(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    results$: of([] as SearchResult[]),
    status$: of('idle'),
    error$: of(null),
    activeQuery$: of(null),
    hasMoreResults$: of(false),
    isLoadingMore$: of(false),
    isLoadingMoreError$: of(false),
    loadNextPage: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('SearchPage', () => {
  function configure(facadeOverrides: Partial<Record<string, unknown>> = {}) {
    TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        { provide: SearchFacade, useValue: makeFacadeStub(facadeOverrides) },
        { provide: QueryHistoryFacade, useValue: { entries: () => [] } },
        { provide: ImagePreviewDialogService, useValue: { open: vi.fn() } },
      ],
    });
  }

  it('shows the error state and retries via the facade', () => {
    configure({ status$: of('error'), error$: of('boom') });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('boom');

    const facade = TestBed.inject(SearchFacade);
    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(facade.retry).toHaveBeenCalled();
  });

  it('shows the empty state for a successful search with zero results', () => {
    configure({ status$: of('success'), activeQuery$: of('dinosaurs'), results$: of([]) });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('dinosaurs');
  });

  it('shows results for a successful search with results', async () => {
    const result: SearchResult = {
      id: '1',
      title: 'A cat',
      imageUrl: '',
      thumbnailUrl: '',
      width: 0,
      height: 0,
      creator: null,
      sourceUrl: '',
    };
    configure({ status$: of('success'), results$: of([result]), hasMoreResults$: of(true) });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    // CdkVirtualScrollViewport renders *cdkVirtualFor content asynchronously (its own
    // internal scheduler), not synchronously on detectChanges() — flush a few ticks so
    // the rendered item is actually in the DOM before asserting on it.
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.textContent).toContain('A cat');
  });

  it('wires the results list retry output to the facade retry, and passes its status inputs through', () => {
    const result: SearchResult = {
      id: '1',
      title: 'A cat',
      imageUrl: '',
      thumbnailUrl: '',
      width: 0,
      height: 0,
      creator: null,
      sourceUrl: '',
    };
    configure({
      status$: of('success'),
      results$: of([result]),
      hasMoreResults$: of(true),
      isLoadingMore$: of(false),
      isLoadingMoreError$: of(true),
    });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    expect(resultsList).toBeTruthy();
    const resultsListInstance = resultsList.componentInstance as SearchResultsList;

    expect(resultsListInstance.hasMoreResults()).toBe(true);
    expect(resultsListInstance.isLoadingMore()).toBe(false);
    expect(resultsListInstance.isLoadingMoreError()).toBe(true);

    resultsListInstance.retry.emit();

    const facade = TestBed.inject(SearchFacade);
    expect(facade.retry).toHaveBeenCalled();
  });

  it('passes a true isLoadingMore input through to the results list', () => {
    const result: SearchResult = {
      id: '1',
      title: 'A cat',
      imageUrl: '',
      thumbnailUrl: '',
      width: 0,
      height: 0,
      creator: null,
      sourceUrl: '',
    };
    configure({
      status$: of('success'),
      results$: of([result]),
      hasMoreResults$: of(true),
      isLoadingMore$: of(true),
    });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    expect((resultsList.componentInstance as SearchResultsList).isLoadingMore()).toBe(true);
  });

  it('wires the results list nextPageRequested output to the facade loadNextPage', () => {
    const result: SearchResult = {
      id: '1',
      title: 'A cat',
      imageUrl: '',
      thumbnailUrl: '',
      width: 0,
      height: 0,
      creator: null,
      sourceUrl: '',
    };
    configure({ status$: of('success'), results$: of([result]), hasMoreResults$: of(true) });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    expect(resultsList).toBeTruthy();
    (resultsList.componentInstance as SearchResultsList).nextPageRequested.emit();

    const facade = TestBed.inject(SearchFacade);
    expect(facade.loadNextPage).toHaveBeenCalled();
  });

  it('should invite the user to start typing, when no search is active', () => {
    configure({ status$: of('idle'), results$: of([]) });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Start typing to search');
  });

  it('opens the image editor dialog via the facade, when a result is selected', () => {
    const result: SearchResult = {
      id: '1',
      title: 'A cat',
      imageUrl: 'https://x/full.jpg',
      thumbnailUrl: '',
      width: 0,
      height: 0,
      creator: null,
      sourceUrl: '',
    };
    configure({ status$: of('success'), results$: of([result]), hasMoreResults$: of(true) });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const resultsList = fixture.debugElement.query(By.directive(SearchResultsList));
    (resultsList.componentInstance as SearchResultsList).resultSelected.emit(result);

    const imagePreviewDialog = TestBed.inject(ImagePreviewDialogService);
    expect(imagePreviewDialog.open).toHaveBeenCalledWith({
      imageId: '1',
      imageUrl: 'https://x/full.jpg',
      title: 'A cat',
      width: 0,
      height: 0,
    });
  });
});
