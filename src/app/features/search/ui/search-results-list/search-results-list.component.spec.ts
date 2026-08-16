import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultsList, VisibleRange } from './search-results-list.component';

const fixtureData = {
  results: (count: number): SearchResult[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380${(index + 10).toString(16).padStart(3, '0')}`,
      title: `Result ${index}`,
      imageUrl: 'https://images.example.org/full.jpg',
      thumbnailUrl: 'https://images.example.org/thumb.jpg',
      width: 800,
      height: 600,
      creator: null,
      sourceUrl: 'https://images.example.org/source',
    })),
};

describe('SearchResultsList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function render(inputs: {
    results: readonly SearchResult[];
    isLoadingMore?: boolean;
    isLoadingMoreError?: boolean;
  }): ComponentFixture<SearchResultsList> {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', inputs.results);
    fixture.componentRef.setInput('isLoadingMore', inputs.isLoadingMore ?? false);
    fixture.componentRef.setInput('isLoadingMoreError', inputs.isLoadingMoreError ?? false);
    fixture.detectChanges();

    return fixture;
  }

  function scrollToIndex(
    fixture: ComponentFixture<SearchResultsList>,
    firstVisibleIndex: number,
    viewportSize: number,
  ): void {
    const viewport = fixture.debugElement.query(By.directive(CdkVirtualScrollViewport));
    vi.spyOn(
      viewport.componentInstance as CdkVirtualScrollViewport,
      'getViewportSize',
    ).mockReturnValue(viewportSize);
    viewport.triggerEventHandler('scrolledIndexChange', firstVisibleIndex);
  }

  async function renderedRows(
    fixture: ComponentFixture<SearchResultsList>,
  ): Promise<NodeListOf<Element>> {
    await vi.advanceTimersByTimeAsync(16);
    fixture.detectChanges();

    return fixture.nativeElement.querySelectorAll('.search-results-list__item');
  }

  it('should render a row per result, when results are given', async () => {
    const fixture = render({ results: fixtureData.results(3) });

    const rows = await renderedRows(fixture);

    expect(rows.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Result 0');
  });

  it('should render no rows, when there are no results', async () => {
    const fixture = render({ results: [] });

    const rows = await renderedRows(fixture);

    expect(rows.length).toBe(0);
  });

  it('should expose the rows as a list to assistive technology, when results are rendered', async () => {
    const fixture = render({ results: fixtureData.results(3) });

    const rows = await renderedRows(fixture);

    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    expect(viewport.getAttribute('role')).toBe('list');
    expect(viewport.querySelector('.cdk-virtual-scroll-content-wrapper').getAttribute('role')).toBe(
      'none',
    );
    rows.forEach((row: Element, index: number) => {
      expect(row.getAttribute('role')).toBe('listitem');
      expect(row.getAttribute('aria-posinset')).toBe(`${index + 1}`);
      expect(row.getAttribute('aria-setsize')).toBe('3');
    });
  });

  it('should emit the selected result, when a row is clicked', async () => {
    const results = fixtureData.results(3);
    const fixture = render({ results });
    const rows = await renderedRows(fixture);

    let selectedResult: SearchResult | undefined;
    fixture.componentInstance.resultSelected.subscribe((result) => (selectedResult = result));
    (rows[1].querySelector('button') as HTMLButtonElement).click();

    expect(selectedResult).toEqual(results[1]);
  });

  it('should emit the visible range, when the scrolled index changes', () => {
    const fixture = render({ results: fixtureData.results(100) });

    let visibleRange: VisibleRange | undefined;
    fixture.componentInstance.scrolled.subscribe((range) => (visibleRange = range));
    scrollToIndex(fixture, 88, 1152);

    expect(visibleRange).toEqual({ firstVisibleIndex: 88, visibleRowCount: 12 });
  });

  it('should emit a visible row count of zero, when the viewport has no measurable size', () => {
    const fixture = render({ results: fixtureData.results(100) });

    let visibleRange: VisibleRange | undefined;
    fixture.componentInstance.scrolled.subscribe((range) => (visibleRange = range));
    scrollToIndex(fixture, 15, 0);

    expect(visibleRange).toEqual({ firstVisibleIndex: 15, visibleRowCount: 0 });
  });

  it('should announce loading politely, when another page is loading', () => {
    const fixture = render({ results: fixtureData.results(5), isLoadingMore: true });

    const loadingBlock = fixture.nativeElement.querySelector('.search-results-list__loading-more');
    expect(loadingBlock.getAttribute('aria-live')).toBe('polite');
    expect(loadingBlock.textContent).toContain('Loading more results');
  });

  it('should render the inline retry block instead of the loading indicator, when loading more failed', () => {
    const fixture = render({ results: fixtureData.results(5), isLoadingMoreError: true });

    expect(
      fixture.nativeElement.querySelector('.search-results-list__load-more-error'),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Loading more results');
  });

  it('should render the inline retry block outside the scroll viewport, when loading more failed', () => {
    const fixture = render({ results: fixtureData.results(5), isLoadingMoreError: true });

    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    const errorBlock = fixture.nativeElement.querySelector('.search-results-list__load-more-error');
    expect(viewport.contains(errorBlock)).toBe(false);
  });

  it('should not render the inline retry block, when loading more has not failed', () => {
    const fixture = render({ results: fixtureData.results(5) });

    expect(
      fixture.nativeElement.querySelector('.search-results-list__load-more-error'),
    ).toBeFalsy();
  });

  it('should emit retry, when the inline retry button is clicked', () => {
    const fixture = render({ results: fixtureData.results(5), isLoadingMoreError: true });

    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    (
      fixture.nativeElement.querySelector(
        '.search-results-list__load-more-error button',
      ) as HTMLButtonElement
    ).click();

    expect(retried).toBe(true);
  });
});
