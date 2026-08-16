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

  it('should report the listbox as collapsed, when the input is not focused', () => {
    const fixture = renderInput();
    const input = inputElement(fixture);
    fixture.componentRef.setInput('suggestions', ['mountains']);
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('should report the listbox as expanded, when focused with suggestions available', () => {
    const fixture = renderInput();
    const input = inputElement(fixture);
    fixture.componentRef.setInput('suggestions', ['mountains']);
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(
      fixture.nativeElement.querySelector('[role="listbox"]').id,
    );
  });

  it('should point aria-activedescendant at the active option, when navigating with the arrow keys', () => {
    const fixture = renderInput();
    const input = inputElement(fixture);
    fixture.componentRef.setInput('suggestions', ['mountains', 'moss']);
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should emit the active suggestion, when Enter is pressed', () => {
    const fixture = renderInput();
    const input = inputElement(fixture);
    const selected = vi.fn();
    fixture.componentRef.setInput('suggestions', ['mountains', 'moss']);
    fixture.componentInstance.suggestionSelected.subscribe(selected);
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(selected).toHaveBeenCalledWith('mountains');
  });

  it('should collapse the listbox, when Escape is pressed', () => {
    const fixture = renderInput();
    const input = inputElement(fixture);
    fixture.componentRef.setInput('suggestions', ['mountains']);
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('should give each instance a unique input id bound to its own label, when two are rendered', () => {
    const first = TestBed.createComponent(SearchInput);
    first.componentRef.setInput('query', '');
    first.componentRef.setInput('suggestions', []);
    first.detectChanges();

    const second = TestBed.createComponent(SearchInput);
    second.componentRef.setInput('query', '');
    second.componentRef.setInput('suggestions', []);
    second.detectChanges();

    const idOf = (fixture: typeof first) => fixture.nativeElement.querySelector('input').id;
    const labelTargetOf = (fixture: typeof first) =>
      fixture.nativeElement.querySelector('label').getAttribute('for');

    expect(idOf(first)).not.toBe(idOf(second));
    expect(labelTargetOf(first)).toBe(idOf(first));
    expect(labelTargetOf(second)).toBe(idOf(second));
  });
});
