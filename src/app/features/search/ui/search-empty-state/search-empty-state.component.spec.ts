import { TestBed } from '@angular/core/testing';
import { SearchEmptyState } from './search-empty-state.component';

describe('SearchEmptyState', () => {
  it('renders a message that includes the searched query', () => {
    TestBed.configureTestingModule({ imports: [SearchEmptyState] });
    const fixture = TestBed.createComponent(SearchEmptyState);
    fixture.componentRef.setInput('query', 'dinosaurs');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('dinosaurs');
  });

  it('should expose the empty message as a single derived string', () => {
    TestBed.configureTestingModule({ imports: [SearchEmptyState] });
    const fixture = TestBed.createComponent(SearchEmptyState);
    fixture.componentRef.setInput('query', 'dinosaurs');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No results for “dinosaurs”');
  });
});
