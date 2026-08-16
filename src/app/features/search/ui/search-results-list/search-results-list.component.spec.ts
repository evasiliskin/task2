import { TestBed } from '@angular/core/testing';
import { SearchResultsList } from './search-results-list.component';
import { SearchResult } from '../../domain/search-result.model';

function makeResults(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i}`,
    title: `Result ${i}`,
    imageUrl: '',
    thumbnailUrl: '',
    width: 0,
    height: 0,
    creator: null,
    sourceUrl: '',
  }));
}

describe('SearchResultsList', () => {
  it('emits scrolled with the first visible index and the visible row count', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(20));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.detectChanges();

    const scrolledSpy = vi.fn();
    fixture.componentInstance.scrolled.subscribe(scrolledSpy);

    (
      fixture.componentInstance as unknown as { onScrolledIndexChange(i: number): void }
    ).onScrolledIndexChange(15);

    expect(scrolledSpy).toHaveBeenCalledWith(expect.objectContaining({ firstVisibleIndex: 15 }));
  });

  it('renders the inline retry block when isLoadingMoreError is true', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.componentRef.setInput('isLoadingMoreError', true);
    fixture.detectChanges();

    const errorBlock = fixture.nativeElement.querySelector('.search-results-list__load-more-error');
    expect(errorBlock).toBeTruthy();
  });

  it('renders the inline retry block outside the virtual-scroll viewport, so it is not clipped by it', () => {
    // CdkVirtualScrollViewport projects its content into an absolutely-positioned wrapper
    // whose scrollable range is sized by itemSize * dataLength — anything projected INTO it
    // after the last item lands past the scrollable range and is unreachable. This must stay
    // a sibling of the viewport, not a child of it.
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.componentRef.setInput('isLoadingMoreError', true);
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    const errorBlock = fixture.nativeElement.querySelector('.search-results-list__load-more-error');
    expect(viewport.contains(errorBlock)).toBe(false);
  });

  it('emits retry when the inline retry button is clicked', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.componentRef.setInput('isLoadingMoreError', true);
    fixture.detectChanges();

    const retrySpy = vi.fn();
    fixture.componentInstance.retry.subscribe(retrySpy);
    const button = fixture.nativeElement.querySelector(
      '.search-results-list__load-more-error button',
    ) as HTMLButtonElement;
    button.click();

    expect(retrySpy).toHaveBeenCalled();
  });

  it('does not render the inline retry block when isLoadingMoreError is false', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.detectChanges();

    const errorBlock = fixture.nativeElement.querySelector('.search-results-list__load-more-error');
    expect(errorBlock).toBeFalsy();
  });

  it('does not render the loading-more indicator when isLoadingMoreError is true', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.componentRef.setInput('isLoadingMoreError', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Loading more results');
  });

  it('should mark the loading-more indicator as a polite live status region', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(5));
    fixture.componentRef.setInput('isLoadingMore', true);
    fixture.detectChanges();

    const loadingBlock = fixture.nativeElement.querySelector('.search-results-list__loading-more');
    expect(loadingBlock.getAttribute('aria-live')).toBe('polite');
  });

  it('emits scrolled with a visible row count derived from the viewport size', () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(100));
    fixture.componentRef.setInput('isLoadingMore', false);
    fixture.detectChanges();

    const instance = fixture.componentInstance as unknown as {
      onScrolledIndexChange(i: number): void;
      viewport: () => { getViewportSize(): number } | undefined;
    };
    Object.defineProperty(instance, 'viewport', { value: () => ({ getViewportSize: () => 1152 }) });

    const scrolledSpy = vi.fn();
    fixture.componentInstance.scrolled.subscribe(scrolledSpy);

    instance.onScrolledIndexChange(88);

    expect(scrolledSpy).toHaveBeenCalledWith({ firstVisibleIndex: 88, visibleRowCount: 12 });
  });

  it('exposes the results as a list for assistive technology', async () => {
    TestBed.configureTestingModule({ imports: [SearchResultsList] });
    const fixture = TestBed.createComponent(SearchResultsList);
    fixture.componentRef.setInput('results', makeResults(3));
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    expect(viewport.getAttribute('role')).toBe('list');

    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    }
    const items = fixture.nativeElement.querySelectorAll('.search-results-list__item');
    expect(items.length).toBeGreaterThan(0);

    const wrapper = viewport.querySelector('.cdk-virtual-scroll-content-wrapper');
    expect(wrapper.getAttribute('role')).toBe('none');

    items.forEach((item: Element, index: number) => {
      expect(item.getAttribute('role')).toBe('listitem');
      expect(item.getAttribute('aria-posinset')).toBe(`${index + 1}`);
      expect(item.getAttribute('aria-setsize')).toBe('3');
    });
  });
});
