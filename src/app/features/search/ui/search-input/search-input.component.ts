import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule, NzInputModule, NzAutocompleteModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  readonly query = input.required<string>();
  readonly suggestions = input.required<readonly string[]>();

  readonly queryChange = output<string>();
}
