import { TestBed } from '@angular/core/testing';
import { SearchResultItem } from './search-result-item.component';
import { SearchResult } from '../../domain/search-result.model';

const result: SearchResult = {
  id: '1',
  title: 'A mountain',
  imageUrl: 'https://x/full.jpg',
  thumbnailUrl: 'https://x/thumb.jpg',
  width: 800,
  height: 600,
  creator: 'Jane',
  sourceUrl: 'https://x/source',
};

describe('SearchResultItem', () => {
  it('renders the thumbnail, title and creator', () => {
    TestBed.configureTestingModule({ imports: [SearchResultItem] });
    const fixture = TestBed.createComponent(SearchResultItem);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe(result.thumbnailUrl);
    expect(fixture.nativeElement.textContent).toContain('A mountain');
    expect(fixture.nativeElement.textContent).toContain('Jane');
  });

  it('emits selected when the button is activated', () => {
    TestBed.configureTestingModule({ imports: [SearchResultItem] });
    const fixture = TestBed.createComponent(SearchResultItem);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    const selectedSpy = vi.fn();
    fixture.componentInstance.selected.subscribe(selectedSpy);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(selectedSpy).toHaveBeenCalled();
  });
});
