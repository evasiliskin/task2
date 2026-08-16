import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NO_ACTIVE_SUGGESTION, nextActiveIndex } from './suggestion-navigation';

let nextInstanceId = 0;

@Component({
  selector: 'app-search-input',
  imports: [NzInputModule, NzButtonModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  readonly query = input.required<string>();
  readonly suggestions = input.required<readonly string[]>();

  readonly queryChange = output<string>();
  readonly suggestionSelected = output<string>();

  private readonly instanceId = nextInstanceId++;
  protected readonly inputId = `search-input-field-${this.instanceId}`;
  protected readonly listboxId = `search-suggestions-${this.instanceId}`;
  protected readonly optionIdPrefix = `search-suggestion-${this.instanceId}`;

  private readonly isFocused = signal(false);
  private readonly isDismissed = signal(false);

  /** Resets whenever the suggestion list changes identity, i.e. on every keystroke. */
  protected readonly activeIndex = linkedSignal<readonly string[], number>({
    source: this.suggestions,
    computation: () => NO_ACTIVE_SUGGESTION,
  });

  protected readonly isOpen = computed(
    () => this.isFocused() && !this.isDismissed() && this.suggestions().length > 0,
  );

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return this.isOpen() && index >= 0 ? `${this.optionIdPrefix}-${index}` : null;
  });

  protected onInput(event: Event): void {
    this.isDismissed.set(false);
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
  }

  protected onClear(): void {
    this.isDismissed.set(false);
    this.queryChange.emit('');
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();

    if (event.key === 'Escape') {
      if (this.isOpen()) {
        event.preventDefault();
        this.isDismissed.set(true);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) {
        return;
      }
      event.preventDefault();
      this.isDismissed.set(false);
      this.activeIndex.set(
        nextActiveIndex(this.activeIndex(), suggestions.length, event.key === 'ArrowDown' ? 1 : -1),
      );
      return;
    }

    if (event.key === 'Enter') {
      const index = this.activeIndex();
      if (!this.isOpen() || index < 0) {
        return;
      }
      event.preventDefault();
      this.select(suggestions[index]);
    }
  }

  protected select(suggestion: string): void {
    this.isDismissed.set(true);
    this.suggestionSelected.emit(suggestion);
  }
}
