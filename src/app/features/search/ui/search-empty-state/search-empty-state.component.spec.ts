import { TestBed } from '@angular/core/testing';
import { SearchEmptyState } from './search-empty-state.component';

describe('SearchEmptyState', () => {
  function renderWithQuery(query: string): HTMLElement {
    TestBed.configureTestingModule({ imports: [SearchEmptyState] });
    const fixture = TestBed.createComponent(SearchEmptyState);
    fixture.componentRef.setInput('query', query);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('should render a message naming the query, when a query is given', () => {
    const element = renderWithQuery('dinosaurs');

    expect(element.textContent).toContain('No results for “dinosaurs”');
    expect(element.textContent).toContain('Try a different search.');
  });

  it('should still render the message, when the query is empty', () => {
    const element = renderWithQuery('');

    expect(element.textContent).toContain('No results for “”');
  });
});
