import { TestBed } from '@angular/core/testing';
import { SearchErrorState } from './search-error-state.component';

describe('SearchErrorState', () => {
  it('renders the error message', () => {
    TestBed.configureTestingModule({ imports: [SearchErrorState] });
    const fixture = TestBed.createComponent(SearchErrorState);
    fixture.componentRef.setInput(
      'message',
      'Network error — check your connection and try again.',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Network error');
  });

  it('emits retry when the retry button is clicked', () => {
    TestBed.configureTestingModule({ imports: [SearchErrorState] });
    const fixture = TestBed.createComponent(SearchErrorState);
    fixture.componentRef.setInput('message', 'boom');
    fixture.detectChanges();

    const retrySpy = vi.fn();
    fixture.componentInstance.retry.subscribe(retrySpy);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(retrySpy).toHaveBeenCalled();
  });
});
