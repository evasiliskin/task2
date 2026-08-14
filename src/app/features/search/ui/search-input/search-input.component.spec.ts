import { TestBed } from '@angular/core/testing';
import { SearchInput } from './search-input.component';
import { SearchFacade } from '../../search.facade';
import { QueryHistoryFacade } from '../../../query-history/query-history.facade';

describe('SearchInput', () => {
  let searchFacade: { search: ReturnType<typeof vi.fn> };
  let queryHistoryFacade: {
    entries: () => { query: string; canonicalQuery: string; words: string[]; lastUsedAt: number }[];
  };

  beforeEach(() => {
    searchFacade = { search: vi.fn() };
    queryHistoryFacade = {
      entries: () => [{ query: 'cats', canonicalQuery: 'cats', words: ['cats'], lastUsedAt: 1 }],
    };

    TestBed.configureTestingModule({
      imports: [SearchInput],
      providers: [
        { provide: SearchFacade, useValue: searchFacade },
        { provide: QueryHistoryFacade, useValue: queryHistoryFacade },
      ],
    });
  });

  it('dispatches a search for every keystroke via the facade', () => {
    const fixture = TestBed.createComponent(SearchInput);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'dogs';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(searchFacade.search).toHaveBeenCalledWith('dogs');
  });

  it('has an accessible label associated with the input', () => {
    const fixture = TestBed.createComponent(SearchInput);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe(input.id);
  });
});
