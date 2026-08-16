import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchResult } from '../../domain/search-result.model';
import { SearchResultItem } from './search-result-item.component';

const fixtureData = {
  result: (overrides: Partial<SearchResult> = {}): SearchResult => ({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'A mountain',
    imageUrl: 'https://images.example.org/full.jpg',
    thumbnailUrl: 'https://images.example.org/thumb.jpg',
    width: 800,
    height: 600,
    creator: 'Jane Doe',
    sourceUrl: 'https://images.example.org/source',
    ...overrides,
  }),
};

describe('SearchResultItem', () => {
  function renderWithResult(result: SearchResult): ComponentFixture<SearchResultItem> {
    TestBed.configureTestingModule({ imports: [SearchResultItem] });
    const fixture = TestBed.createComponent(SearchResultItem);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    return fixture;
  }

  it('should render the thumbnail, title and creator, when a result is given', () => {
    const result = fixtureData.result();

    const fixture = renderWithResult(result);

    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(image.src).toBe(result.thumbnailUrl);
    expect(image.alt).toBe(result.title);
    expect(fixture.nativeElement.textContent).toContain('A mountain');
    expect(fixture.nativeElement.textContent).toContain('Jane Doe');
  });

  it('should render the title without a creator line, when the result has no creator', () => {
    const fixture = renderWithResult(fixtureData.result({ creator: null }));

    expect(fixture.nativeElement.textContent).toContain('A mountain');
    expect(fixture.nativeElement.textContent).not.toContain('by ');
  });

  it('should load the thumbnail lazily, when the item is rendered', () => {
    const fixture = renderWithResult(fixtureData.result());

    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(image.getAttribute('loading')).toBe('lazy');
  });

  it('should emit selected, when the item button is clicked', () => {
    const fixture = renderWithResult(fixtureData.result());

    let selectedCount = 0;
    fixture.componentInstance.selected.subscribe(() => (selectedCount += 1));
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(selectedCount).toBe(1);
  });
});
