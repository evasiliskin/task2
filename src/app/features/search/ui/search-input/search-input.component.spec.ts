import { TestBed } from '@angular/core/testing';
import { SearchInput } from './search-input.component';

describe('SearchInput', () => {
  function setup(suggestions: readonly string[] = []) {
    TestBed.configureTestingModule({ imports: [SearchInput] });
    const fixture = TestBed.createComponent(SearchInput);
    fixture.componentRef.setInput('query', '');
    fixture.componentRef.setInput('suggestions', suggestions);
    fixture.detectChanges();
    return fixture;
  }

  it('emits queryChange for every keystroke', () => {
    const fixture = setup();

    const queryChangeSpy = vi.fn();
    fixture.componentInstance.queryChange.subscribe(queryChangeSpy);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'dogs';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(queryChangeSpy).toHaveBeenCalledWith('dogs');
  });

  it('has an accessible label associated with the input', () => {
    const fixture = setup();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe(input.id);
  });
});
