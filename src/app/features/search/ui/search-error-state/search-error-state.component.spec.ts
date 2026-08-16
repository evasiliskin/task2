import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchErrorKind } from '../../state/to-search-error-kind';
import { SearchErrorState } from './search-error-state.component';

describe('SearchErrorState', () => {
  function renderWithKind(errorKind: SearchErrorKind | null): ComponentFixture<SearchErrorState> {
    TestBed.configureTestingModule({ imports: [SearchErrorState] });
    const fixture = TestBed.createComponent(SearchErrorState);
    fixture.componentRef.setInput('errorKind', errorKind);
    fixture.detectChanges();

    return fixture;
  }

  it('should render the message for the given kind, when the kind is offline', () => {
    const fixture = renderWithKind('offline');

    expect(fixture.nativeElement.textContent).toContain(
      'Network error — check your connection and try again.',
    );
  });

  it('should render the fallback message, when the kind is missing', () => {
    const fixture = renderWithKind(null);

    expect(fixture.nativeElement.textContent).toContain('Something went wrong. Please try again.');
  });

  it('should emit retry, when the retry button is clicked', () => {
    const fixture = renderWithKind('unknown');

    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(retried).toBe(true);
  });
});
