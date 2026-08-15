import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule, NzInputModule, NzAutocompleteModule, NzButtonModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  readonly query = input.required<string>();
  readonly suggestions = input.required<readonly string[]>();

  readonly queryChange = output<string>();
}
