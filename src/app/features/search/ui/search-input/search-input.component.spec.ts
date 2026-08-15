import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInput } from './search-input.component';

function renderInput(
  options: { query?: string; suggestions?: readonly string[] } = {},
): ComponentFixture<SearchInput> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [SearchInput] });
  const fixture = TestBed.createComponent(SearchInput);
  fixture.componentRef.setInput('query', options.query ?? '');
  fixture.componentRef.setInput('suggestions', options.suggestions ?? []);
  fixture.detectChanges();
  return fixture;
}

function inputElement(fixture: ComponentFixture<SearchInput>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input');
}

function clearButton(fixture: ComponentFixture<SearchInput>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.search-input__clear');
}

function fieldElement(fixture: ComponentFixture<SearchInput>): HTMLElement {
  return fixture.nativeElement.querySelector('.search-input__field');
}

describe('SearchInput', () => {
  it('emits queryChange for every keystroke', () => {
    const fixture = renderInput();

    const queryChangeSpy = vi.fn();
    fixture.componentInstance.queryChange.subscribe(queryChangeSpy);

    const input = inputElement(fixture);
    input.value = 'dogs';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(queryChangeSpy).toHaveBeenCalledWith('dogs');
  });

  it('has an accessible label associated with the input', () => {
    const fixture = renderInput();

    const input = inputElement(fixture);
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('should expose combobox semantics, when rendered', () => {
    const input = inputElement(renderInput());

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('type')).toBe('search');
  });

  it('should emit an empty query, when the clear button is pressed', () => {
    const fixture = renderInput({ query: 'cats' });
    const emitted: string[] = [];
    fixture.componentInstance.queryChange.subscribe((value) => emitted.push(value));

    clearButton(fixture).click();

    expect(emitted).toEqual(['']);
  });

  it('should keep the clear button inside the input field row, not as a separate flex row', () => {
    const fixture = renderInput({ query: 'cats' });

    const button = clearButton(fixture);
    const field = fieldElement(fixture);

    expect(field.contains(button)).toBe(true);
  });

  it('should not grow the field wrapper height, when the clear button appears', () => {
    const emptyFixture = renderInput({ query: '' });
    const heightWithoutButton = fieldElement(emptyFixture).getBoundingClientRect().height;

    const filledFixture = renderInput({ query: 'cats' });
    const heightWithButton = fieldElement(filledFixture).getBoundingClientRect().height;

    expect(clearButton(emptyFixture)).toBeNull();
    expect(clearButton(filledFixture)).not.toBeNull();
    expect(heightWithButton).toBe(heightWithoutButton);
  });
});
